package com.SolarShare.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.SolarShare.model.AgreementDocument;
import com.SolarShare.model.RooftopListing;

public interface AgreementDocumentRepository extends JpaRepository<AgreementDocument, Long> {
    Optional<AgreementDocument> findByListing(RooftopListing listing);
    
    @Query("SELECT a FROM AgreementDocument a WHERE a.listing.clusterProject.id = :clusterId")
    List<AgreementDocument> findByClusterId(@Param("clusterId") Long clusterId);
}
