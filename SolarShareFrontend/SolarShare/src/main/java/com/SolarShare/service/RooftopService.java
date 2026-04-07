package com.SolarShare.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.SolarShare.model.AgreementDocument;
import com.SolarShare.model.ClusterProject;
import com.SolarShare.model.RooftopListing;
import com.SolarShare.model.UserInfo;
import com.SolarShare.model.UserType;
import com.SolarShare.repo.ClusterProjectRepo;
import com.SolarShare.repo.AgreementDocumentRepository;
import com.SolarShare.repo.RooftopRepository;
import com.SolarShare.repo.UserInfoRepository;

@Service
public class RooftopService {

    @Autowired
    private RooftopRepository rooftopRepo;

    @Autowired
    private UserInfoRepository userInfoRepo;

    @Autowired
    private AgreementDocumentRepository agreementDocumentRepository;

    @Autowired
    private ClusterProjectRepo projectRepo;

    @Autowired
    private AgreementPdfService agreementPdfService;

    @Autowired
    private EmailNotificationService emailNotificationService;

    @Transactional
    public RooftopListing createListing(RooftopListing listing, String username) {
        UserInfo owner = userInfoRepo.findByUserUsername(username);
        if (owner == null) {
            throw new RuntimeException("User profile not found");
        }
        if (owner.getType() != UserType.HOMEOWNER) {
            throw new RuntimeException("Only rooftop owners can create listings");
        }
        if (listing.getAddress() == null || listing.getAddress().isBlank()) {
            throw new RuntimeException("Listing address is required");
        }
        if (listing.getAreaSquareFt() == null || listing.getAreaSquareFt() <= 0) {
            throw new RuntimeException("Listing area must be greater than zero");
        }
        listing.setOwner(owner);
        // Auto-calculate monthly rent at Rs 5 per sq ft
//        if (listing.getAreaSquareFt() != null && listing.getAreaSquareFt() > 0) {
//            listing.setExpectedRent((long) (listing.getAreaSquareFt() * 5));
//        }
        RooftopListing saved = rooftopRepo.save(listing);
        emailNotificationService.sendListingCreatedEmail(owner, saved);
        return saved;
    }

    public List<RooftopListing> getAllListings() {
        return rooftopRepo.findByClusterProjectNull();
    }

    @Transactional
    public void addInterest(Long listingId, String companyUsername) {
        RooftopListing listing = rooftopRepo.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        if (listing.getClusterProject() != null) {
            throw new RuntimeException("This rooftop is already reserved in a cluster");
        }

        UserInfo company = userInfoRepo.findByUserUsername(companyUsername);

        if (company.getType() != UserType.SOLAR_COMPANY) {
            throw new RuntimeException("Only solar providers can express interest");
        }

        if (listing.getInterestedCompanies().contains(company)) {
            throw new RuntimeException("Already interest listed for this property");
        }

        listing.getInterestedCompanies().add(company);
        rooftopRepo.save(listing);
        emailNotificationService.sendInterestNotificationEmail(listing.getOwner(), company, listing);
    }

    public List<RooftopListing> getListingsByOwner(String username) {
        UserInfo owner = userInfoRepo.findByUserUsername(username);
        return rooftopRepo.findByOwner(owner);
    }

    @Transactional
    public void deleteListingByOwner(Long listingId, String ownerUsername) {
        RooftopListing listing = rooftopRepo.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        UserInfo owner = userInfoRepo.findByUserUsername(ownerUsername);
        if (owner == null || listing.getOwner() == null || !listing.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only listing owner can remove this listing");
        }

        if (listing.getAcceptedCompany() != null) {
            throw new RuntimeException("Accepted listings cannot be removed");
        }
        if (listing.getInterestedCompanies() != null && !listing.getInterestedCompanies().isEmpty()) {
            throw new RuntimeException("Only idle listings with no active interests can be removed");
        }
        if (agreementDocumentRepository.findByListing(listing).isPresent()) {
            throw new RuntimeException("Listing has an agreement and cannot be removed");
        }

        ClusterProject clusterProject = listing.getClusterProject();
        if (clusterProject != null) {
            ClusterProject managedProject = projectRepo.findById(clusterProject.getId())
                    .orElseThrow(() -> new RuntimeException("Cluster project not found"));

            if (managedProject.isFull() || managedProject.isAgreementGenerated()) {
                throw new RuntimeException("Cannot remove listing after cluster is full or agreement is generated");
            }

            managedProject.getContributions().removeIf(item -> item.getId().equals(listing.getId()));
            listing.setClusterProject(null);
            rooftopRepo.delete(listing);
            recalculateClusterProgress(managedProject);
            projectRepo.save(managedProject);
            return;
        }

        rooftopRepo.delete(listing);
    }

    @Transactional
    public RooftopListing acceptCompanyForListing(Long listingId, Long companyId, String ownerUsername) {
        RooftopListing listing = rooftopRepo.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        UserInfo owner = userInfoRepo.findByUserUsername(ownerUsername);
        if (owner == null) {
            throw new RuntimeException("User profile not found");
        }
        if (listing.getOwner() == null || !listing.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only listing owner can accept a company");
        }

        if (listing.getAcceptedCompany() != null) {
            throw new RuntimeException("This rooftop has already been accepted and cannot be changed");
        }

        UserInfo company = userInfoRepo.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        if (company.getType() != UserType.SOLAR_COMPANY) {
            throw new RuntimeException("Selected user is not a solar company");
        }

        if (!listing.getInterestedCompanies().contains(company)) {
            throw new RuntimeException("This company has not expressed interest in the listing");
        }

        ClusterProject clusterProject = listing.getClusterProject();
        if (clusterProject != null) {
            if (clusterProject.isAgreementGenerated()) {
                throw new RuntimeException("Cluster agreement is already generated; no further changes are allowed");
            }

            if (clusterProject.getCreator() == null || !clusterProject.getCreator().getId().equals(company.getId())) {
                throw new RuntimeException("For cluster rooftops, only the cluster creator company can be accepted");
            }
        }

        listing.setAcceptedCompany(company);
        listing.setAcceptedAt(LocalDateTime.now());
        RooftopListing savedListing = rooftopRepo.save(listing);

        if (clusterProject != null) {
            ClusterProject managedProject = projectRepo.findById(clusterProject.getId())
                    .orElseThrow(() -> new RuntimeException("Cluster project not found"));

            List<RooftopListing> clusterListings = rooftopRepo.findByClusterProject(managedProject);
            double contributedArea = 0.0;
            for (RooftopListing clusterListing : clusterListings) {
                boolean creatorInterested = clusterListing.getInterestedCompanies() != null
                        && clusterListing.getInterestedCompanies().stream().anyMatch(interested ->
                        interested.getId() != null && interested.getId().equals(managedProject.getCreator().getId()));
                boolean creatorAccepted = clusterListing.getAcceptedCompany() != null
                        && clusterListing.getAcceptedCompany().getId().equals(managedProject.getCreator().getId());

                if ((creatorInterested || creatorAccepted)
                        && clusterListing.getAreaSquareFt() != null
                        && clusterListing.getAreaSquareFt() > 0) {
                    contributedArea += clusterListing.getAreaSquareFt();
                }
            }

            managedProject.setCurrentArea(contributedArea);
            managedProject.setFull(contributedArea >= managedProject.getTargetArea());

            if (managedProject.isFull() && !managedProject.isAgreementGenerated()) {
                finalizeClusterAgreements(managedProject);
            }
            projectRepo.save(managedProject);
        } else {
            byte[] pdf = agreementPdfService.generateSampleAgreement(savedListing, owner, company);
            AgreementDocument agreement = agreementDocumentRepository.findByListing(savedListing)
                    .orElseGet(AgreementDocument::new);
            agreement.setListing(savedListing);
            agreement.setPdfContent(pdf);
            agreement.setFileName(buildAgreementFileName(savedListing));
            agreement.setCreatedAt(LocalDateTime.now());
            agreementDocumentRepository.save(agreement);

            emailNotificationService.sendListingAcceptedEmails(owner, company, savedListing);
        }

        return savedListing;
    }

    @Transactional(readOnly = true)
    public AgreementDocument getAgreementForListing(Long listingId, String username) {
        RooftopListing listing = rooftopRepo.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        UserInfo requestingUser = userInfoRepo.findByUserUsername(username);
        if (requestingUser == null) {
            throw new RuntimeException("User profile not found");
        }

        boolean isOwner = listing.getOwner() != null && listing.getOwner().getId().equals(requestingUser.getId());
        boolean isAcceptedCompany = listing.getAcceptedCompany() != null
                && listing.getAcceptedCompany().getId().equals(requestingUser.getId());

        if (!isOwner && !isAcceptedCompany) {
            throw new RuntimeException("You are not authorized to download this agreement");
        }

        return agreementDocumentRepository.findByListing(listing)
                .orElseThrow(() -> new RuntimeException("Agreement is not generated for this listing"));
    }

    @Transactional
    public RooftopListing optOutFromCluster(Long listingId, String username) {
        RooftopListing listing = rooftopRepo.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        UserInfo owner = userInfoRepo.findByUserUsername(username);
        if (owner == null) {
            throw new RuntimeException("User profile not found");
        }
        if (listing.getOwner() == null || !listing.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only the rooftop owner can opt out");
        }

        ClusterProject project = listing.getClusterProject();
        if (project == null) {
            throw new RuntimeException("This rooftop is not part of any cluster");
        }

        if (project.isFull() || project.isAgreementGenerated()) {
            throw new RuntimeException("Cluster agreement is already generated, opt-out is no longer allowed");
        }

        if (listing.getAcceptedCompany() != null) {
            throw new RuntimeException("Accepted cluster contribution cannot be reverted");
        }

        project.getContributions().removeIf(item -> item.getId().equals(listing.getId()));
        project.setFull(project.getCurrentArea() >= project.getTargetArea());

        listing.setClusterProject(null);
        rooftopRepo.save(listing);
        projectRepo.save(project);

        return listing;
    }

    @Transactional
    public void finalizeClusterAgreements(ClusterProject project) {
        if (project == null || project.isAgreementGenerated() || !project.isFull()) {
            return;
        }

        UserInfo creator = project.getCreator();
        if (creator == null || creator.getUser() == null) {
            throw new RuntimeException("Cluster creator is missing");
        }

        int generatedCount = 0;
        for (RooftopListing listing : rooftopRepo.findByClusterProject(project)) {
            if (listing.getOwner() == null || listing.getOwner().getUser() == null) {
                continue;
            }

            boolean creatorInterested = listing.getInterestedCompanies() != null
                    && listing.getInterestedCompanies().stream().anyMatch(interested ->
                    interested.getId() != null && interested.getId().equals(creator.getId()));
            UserInfo agreementCompany = listing.getAcceptedCompany() != null ? listing.getAcceptedCompany() : creator;
            if (listing.getAcceptedCompany() == null && creatorInterested) {
                listing.setAcceptedCompany(creator);
                listing.setAcceptedAt(LocalDateTime.now());
                rooftopRepo.save(listing);
            }

            if (listing.getAcceptedCompany() == null && !creatorInterested) {
                continue;
            }

            AgreementDocument agreement = agreementDocumentRepository.findByListing(listing)
                    .orElseGet(AgreementDocument::new);
            agreement.setListing(listing);
            agreement.setPdfContent(agreementPdfService.generateClusterAgreement(project, listing, listing.getOwner(), agreementCompany));
            agreement.setFileName("cluster-agreement-" + project.getId() + "-listing-" + listing.getId() + ".pdf");
            agreement.setCreatedAt(LocalDateTime.now());
            agreementDocumentRepository.save(agreement);
            generatedCount++;
        }

        if (generatedCount > 0) {
            project.setAgreementGenerated(true);
            project.setAgreementGeneratedAt(LocalDateTime.now());
            projectRepo.save(project);
        }
    }

    private String buildAgreementFileName(RooftopListing listing) {
        return "rent-agreement-listing-" + listing.getId() + ".pdf";
    }

    private void recalculateClusterProgress(ClusterProject project) {
        if (project == null || project.getCreator() == null || project.getCreator().getId() == null) {
            if (project != null) {
                project.setCurrentArea(0.0);
                project.setFull(false);
            }
            return;
        }

        Long creatorId = project.getCreator().getId();
        double totalContributedArea = rooftopRepo.findByClusterProject(project).stream()
                .filter(item -> {
                    boolean creatorInterested = item.getInterestedCompanies() != null
                            && item.getInterestedCompanies().stream().anyMatch(company -> company.getId().equals(creatorId));
                    boolean creatorAccepted = item.getAcceptedCompany() != null
                            && item.getAcceptedCompany().getId().equals(creatorId);
                    return creatorInterested || creatorAccepted;
                })
                .map(RooftopListing::getAreaSquareFt)
                .filter(area -> area != null && area > 0)
                .reduce(0.0, Double::sum);

        project.setCurrentArea(totalContributedArea);
        project.setFull(totalContributedArea >= project.getTargetArea());
    }
}
