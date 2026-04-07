package com.SolarShare.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.SolarShare.model.ClusterProject;
import com.SolarShare.model.RooftopListing;
import com.SolarShare.model.UserInfo;
import com.SolarShare.model.UserType;
import com.SolarShare.repo.ClusterProjectRepo;
import com.SolarShare.repo.RooftopRepository;
import com.SolarShare.repo.UserInfoRepository;

import jakarta.transaction.Transactional;

@Service
public class ClusterService {
    @Autowired
    private ClusterProjectRepo projectRepo;
    @Autowired private RooftopRepository rooftopRepo;
    @Autowired private UserInfoRepository userRepo;
    @Autowired private RooftopService rooftopService;

    @Transactional
    public ResponseEntity<?> contributeToCluster(Long clusterId, RooftopListing listing, String username) {
        ClusterProject project = projectRepo.findById(clusterId).orElseThrow();

        if (project.isFull()) return ResponseEntity.badRequest().body("Project is already full!");
        if (listing == null) {
            return ResponseEntity.badRequest().body("Listing payload is required");
        }

        UserInfo owner = userRepo.findByUserUsername(username);
        if (owner == null) {
            return ResponseEntity.badRequest().body("User profile not found");
        }
        if (owner.getType() != UserType.HOMEOWNER) {
            return ResponseEntity.badRequest().body("Only rooftop owners can contribute space to clusters");
        }

        if (listing.getAreaSquareFt() == null || listing.getAreaSquareFt() <= 0) {
            return ResponseEntity.badRequest().body("Contribution area must be greater than zero");
        }
        if (listing.getAddress() == null || listing.getAddress().isBlank()) {
            return ResponseEntity.badRequest().body("Address is required for cluster contribution");
        }

        listing.setId(null);
        listing.setAcceptedCompany(null);
        listing.setAcceptedAt(null);
        listing.getInterestedCompanies().clear();
        listing.setOwner(owner);
        listing.setClusterProject(project);
        listing.setCity(project.getCity());

        rooftopRepo.save(listing);

        recalculateProgress(project);
        if (project.isFull() && !project.isAgreementGenerated()) {
            rooftopService.finalizeClusterAgreements(project);
        }
        projectRepo.save(project);

        return ResponseEntity.ok(project);
    }

    public ClusterProject createNewCluster(ClusterProject cluster, String username) {
        UserInfo creator = userRepo.findByUserUsername(username);

        if (creator == null) {
            throw new RuntimeException("User profile not found");
        }

        if (creator.getType() != UserType.SOLAR_COMPANY) {
            throw new RuntimeException("Only providers (Solar Companies) can create clusters.");
        }
        if (cluster.getProjectName() == null || cluster.getProjectName().isBlank()) {
            throw new RuntimeException("Project name is required");
        }
        if (cluster.getCity() == null || cluster.getCity().isBlank()) {
            throw new RuntimeException("Cluster city is required");
        }

        cluster.setCreator(creator);
        cluster.setCurrentArea(0.0);
        cluster.setFull(false);
        if (cluster.getTargetArea() <= 0) {
            cluster.setTargetArea(5000.0);
        }
        return projectRepo.save(cluster);
    }

    public List<ClusterProject> getAllClusters() {
        List<ClusterProject> clusters = projectRepo.findAll();
        clusters.sort(
                Comparator.comparing(ClusterProject::isFull)
                        .thenComparing(ClusterProject::getId, Comparator.nullsLast(Comparator.reverseOrder()))
        );
        return clusters;
    }

    @Transactional
    public void addInterestToPool(Long clusterId, String companyUsername) {
        ClusterProject project = projectRepo.findById(clusterId)
                .orElseThrow(() -> new RuntimeException("Cluster not found"));

        if (project.isFull() || project.isAgreementGenerated()) {
            throw new RuntimeException("Cluster is already full; no further interest actions are allowed");
        }

        UserInfo company = userRepo.findByUserUsername(companyUsername);
        if (company == null) {
            throw new RuntimeException("User profile not found");
        }

        if (company.getType() != UserType.SOLAR_COMPANY) {
            throw new RuntimeException("Only Solar Companies can express interest in clusters.");
        }
        if (project.getCreator() == null || !project.getCreator().getId().equals(company.getId())) {
            throw new RuntimeException("Only cluster creator company can show interest in this cluster");
        }

        boolean creatorAlreadyInterested = project.getInterestedCompanies().stream()
                .anyMatch(item -> item.getId().equals(company.getId()));
        if (!creatorAlreadyInterested) {
            project.getInterestedCompanies().add(company);
        }

        for (RooftopListing listing : rooftopRepo.findByClusterProject(project)) {
            boolean listingAlreadyInterested = listing.getInterestedCompanies().stream()
                    .anyMatch(item -> item.getId().equals(company.getId()));
            if (!listingAlreadyInterested) {
                listing.getInterestedCompanies().add(company);
                rooftopRepo.save(listing);
            }
        }

        recalculateProgress(project);
        if (project.isFull() && !project.isAgreementGenerated()) {
            rooftopService.finalizeClusterAgreements(project);
        }
        projectRepo.save(project);
    }

    @Transactional
    public ResponseEntity<?> rejectContribution(Long clusterId, Long listingId, String username) {
        ClusterProject project = projectRepo.findById(clusterId)
                .orElseThrow(() -> new RuntimeException("Cluster not found"));

        UserInfo company = userRepo.findByUserUsername(username);
        if (company == null || project.getCreator() == null || !project.getCreator().getId().equals(company.getId())) {
            return ResponseEntity.badRequest().body("Only cluster creator can reject contributions");
        }

        if (project.isFull() || project.isAgreementGenerated()) {
            return ResponseEntity.badRequest().body("Cannot reject contributions after cluster is full or agreements are generated");
        }

        RooftopListing listing = rooftopRepo.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        if (listing.getClusterProject() == null || !listing.getClusterProject().getId().equals(project.getId())) {
            return ResponseEntity.badRequest().body("Listing is not part of this cluster");
        }

        listing.setClusterProject(null);
        listing.setAcceptedCompany(null);
        listing.setAcceptedAt(null);
        listing.getInterestedCompanies().clear();
        rooftopRepo.save(listing);

        recalculateProgress(project);
        projectRepo.save(project);

        return ResponseEntity.ok(project);
    }

    @Transactional
    public ResponseEntity<?> dissolveCluster(Long clusterId, String username) {
        ClusterProject project = projectRepo.findById(clusterId)
                .orElseThrow(() -> new RuntimeException("Cluster not found"));

        UserInfo user = userRepo.findByUserUsername(username);
        if (user == null || !user.getId().equals(project.getCreator().getId())) {
            return ResponseEntity.badRequest().body("Only cluster creator can dissolve the cluster");
        }

        if (project.isFull()) {
            return ResponseEntity.badRequest().body("Cannot dissolve a full cluster. Use publish to finalize agreements instead.");
        }

        if (project.isAgreementGenerated()) {
            return ResponseEntity.badRequest().body("Cannot dissolve a cluster with agreements already generated");
        }

        for (RooftopListing listing : project.getContributions()) {
            listing.setClusterProject(null);
            rooftopRepo.save(listing);
        }

        project.getContributions().clear();
        projectRepo.delete(project);

        return ResponseEntity.ok("Cluster dissolved successfully");
    }

    @Transactional
    public ResponseEntity<?> publishCluster(Long clusterId, String username) {
        ClusterProject project = projectRepo.findById(clusterId)
                .orElseThrow(() -> new RuntimeException("Cluster not found"));

        UserInfo user = userRepo.findByUserUsername(username);
        if (user == null || !user.getId().equals(project.getCreator().getId())) {
            return ResponseEntity.badRequest().body("Only cluster creator can publish the cluster");
        }

        if (!project.isFull()) {
            return ResponseEntity.badRequest().body("Cluster must be full before publishing");
        }

        if (project.isAgreementGenerated()) {
            return ResponseEntity.ok(project);
        }

        rooftopService.finalizeClusterAgreements(project);
        return ResponseEntity.ok(project);
    }

    @Transactional
    public ResponseEntity<?> optOutFromCluster(Long clusterId, Long listingId, String username) {
        ClusterProject project = projectRepo.findById(clusterId)
                .orElseThrow(() -> new RuntimeException("Cluster not found"));

        if (project.isFull() || project.isAgreementGenerated()) {
            return ResponseEntity.badRequest().body("Cluster agreement is already generated, opt-out is not allowed");
        }

        RooftopListing listing = rooftopRepo.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        UserInfo owner = userRepo.findByUserUsername(username);
        if (listing.getOwner() == null || !listing.getOwner().getId().equals(owner.getId())) {
            return ResponseEntity.badRequest().body("Only the rooftop owner can opt out");
        }

        if (listing.getClusterProject() == null || !listing.getClusterProject().getId().equals(project.getId())) {
            return ResponseEntity.badRequest().body("Listing is not part of this cluster");
        }

        if (listing.getAcceptedCompany() != null) {
            return ResponseEntity.badRequest().body("Accepted cluster contribution cannot be reverted");
        }

        project.getContributions().removeIf(item -> item.getId().equals(listing.getId()));
        listing.setClusterProject(null);
        rooftopRepo.save(listing);
        recalculateProgress(project);
        projectRepo.save(project);

        return ResponseEntity.ok(project);
    }

    private void recalculateProgress(ClusterProject project) {
        if (project == null || project.getCreator() == null || project.getCreator().getId() == null) {
            if (project != null) {
                project.setCurrentArea(0.0);
                project.setFull(false);
            }
            return;
        }

        Long creatorId = project.getCreator().getId();
        double totalContributedArea = rooftopRepo.findByClusterProject(project).stream()
                .filter(listing -> {
                    boolean creatorInterested = listing.getInterestedCompanies() != null
                            && listing.getInterestedCompanies().stream().anyMatch(company -> company.getId().equals(creatorId));
                    boolean creatorAccepted = listing.getAcceptedCompany() != null
                            && listing.getAcceptedCompany().getId().equals(creatorId);
                    return creatorInterested || creatorAccepted;
                })
                .map(RooftopListing::getAreaSquareFt)
                .filter(area -> area != null && area > 0)
                .reduce(0.0, Double::sum);

        project.setCurrentArea(totalContributedArea);
        project.setFull(totalContributedArea >= project.getTargetArea());
    }
}
