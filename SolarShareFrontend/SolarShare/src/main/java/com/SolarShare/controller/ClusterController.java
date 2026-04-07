package com.SolarShare.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.SolarShare.model.AgreementDocument;
import com.SolarShare.model.ClusterProject;
import com.SolarShare.model.RooftopListing;
import com.SolarShare.repo.AgreementDocumentRepository;
import com.SolarShare.service.ClusterService;

@RestController
@RequestMapping("/api/clusters")
//@CrossOrigin(originPatterns = "*")
public class ClusterController {
    @Autowired private ClusterService clusterService;
    @Autowired private AgreementDocumentRepository agreementDocumentRepository;

    @GetMapping("/all")
    public List<ClusterProject> getClusters() {
        return clusterService.getAllClusters();
    }

    @PostMapping("/{clusterId}/join")
    public ResponseEntity<?> joinCluster(@PathVariable Long clusterId, @RequestBody RooftopListing listing, Authentication auth) {
        return clusterService.contributeToCluster(clusterId, listing, auth.getName());
    }

    @PostMapping("/create")
    public ResponseEntity<?> createCluster(@RequestBody ClusterProject cluster, Authentication auth) {
        try {
            ClusterProject created = clusterService.createNewCluster(cluster, auth.getName());
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/interest")
    public ResponseEntity<?> expressInterestInPool(@PathVariable Long id, Authentication auth) {
        try {
            clusterService.addInterestToPool(id, auth.getName());
            return ResponseEntity.ok("Interest recorded for the entire community pool!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Could not record interest: " + e.getMessage());
        }
    }

    @PostMapping("/{clusterId}/contributions/{listingId}/opt-out")
    public ResponseEntity<?> optOutFromCluster(
            @PathVariable Long clusterId,
            @PathVariable Long listingId,
            Authentication auth
    ) {
        try {
            return clusterService.optOutFromCluster(clusterId, listingId, auth.getName());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{clusterId}/contributions/{listingId}/reject")
    public ResponseEntity<?> rejectContribution(
            @PathVariable Long clusterId,
            @PathVariable Long listingId,
            Authentication auth
    ) {
        try {
            return clusterService.rejectContribution(clusterId, listingId, auth.getName());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{clusterId}/dissolve")
    public ResponseEntity<?> dissolveCluster(@PathVariable Long clusterId, Authentication auth) {
        try {
            return clusterService.dissolveCluster(clusterId, auth.getName());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{clusterId}/publish")
    public ResponseEntity<?> publishCluster(@PathVariable Long clusterId, Authentication auth) {
        try {
            return clusterService.publishCluster(clusterId, auth.getName());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{clusterId}/agreements")
    public ResponseEntity<?> getClusterAgreements(@PathVariable Long clusterId) {
        try {
            List<AgreementDocument> agreements = agreementDocumentRepository.findByClusterId(clusterId);
            return ResponseEntity.ok(agreements);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Could not retrieve agreements: " + e.getMessage());
        }
    }

    @GetMapping("/agreements/{agreementId}/download")
    public ResponseEntity<?> downloadAgreement(@PathVariable Long agreementId) {
        try {
            AgreementDocument agreement = agreementDocumentRepository.findById(agreementId)
                    .orElseThrow(() -> new Exception("Agreement not found"));
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", agreement.getFileName());
            
            return new ResponseEntity<>(agreement.getPdfContent(), headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Could not download agreement: " + e.getMessage());
        }
    }
}