package com.SolarShare.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "agreement_documents")
public class AgreementDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "listing_id", unique = true)
    private RooftopListing listing;

    @Lob
    @Column(nullable = false)
    private byte[] pdfContent;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
