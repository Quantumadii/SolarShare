package com.SolarShare.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.SolarShare.model.AgreementDocument;
import com.SolarShare.model.RooftopListing;
import com.SolarShare.service.RooftopService;

@RestController
@RequestMapping("/api/listings")
//@CrossOrigin(originPatterns = "*")
public class ListingController {

    @Autowired
    private RooftopService rooftopService;

    @PostMapping("/create")
    public ResponseEntity<?> createListing(@RequestBody RooftopListing listing, Authentication authentication) {
        try {
            String username = authentication.getName();
            RooftopListing savedListing = rooftopService.createListing(listing, username);
            return ResponseEntity.ok(savedListing);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating listing: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public List<RooftopListing> getAllListings() {
        return rooftopService.getAllListings();
    }

    @PostMapping("/{id}/interest")
    public ResponseEntity<?> expressInterest(@PathVariable Long id, Authentication authentication) {
        try {
            rooftopService.addInterest(id, authentication.getName());
            return ResponseEntity.ok("Interest recorded");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my-listings")
    public ResponseEntity<List<RooftopListing>> getMyListings(Authentication authentication) {
        String username = authentication.getName();
        List<RooftopListing> myListings = rooftopService.getListingsByOwner(username);
        return ResponseEntity.ok(myListings);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteListing(@PathVariable Long id, Authentication authentication) {
        try {
            rooftopService.deleteListingByOwner(id, authentication.getName());
            return ResponseEntity.ok("Listing removed successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/accept/{companyId}")
    public ResponseEntity<?> acceptCompanyForListing(
            @PathVariable Long id,
            @PathVariable Long companyId,
            Authentication authentication
    ) {
        try {
            RooftopListing updated = rooftopService.acceptCompanyForListing(id, companyId, authentication.getName());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/agreement")
    public ResponseEntity<?> downloadAgreement(@PathVariable Long id, Authentication authentication) {
        try {
            AgreementDocument agreement = rooftopService.getAgreementForListing(id, authentication.getName());
            ByteArrayResource resource = new ByteArrayResource(agreement.getPdfContent());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + agreement.getFileName() + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(agreement.getPdfContent().length)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
