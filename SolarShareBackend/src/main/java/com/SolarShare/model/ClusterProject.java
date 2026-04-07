package com.SolarShare.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "cluster_projects")
public class ClusterProject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String projectName;
    private String city;
    private double targetArea = 5000.0;
    private double currentArea = 0.0;
    private boolean isFull = false;
    private boolean agreementGenerated = false;
    private LocalDateTime agreementGeneratedAt;

    @ManyToOne
    @JoinColumn(name = "creator_id")
    private UserInfo creator;

    @OneToMany(mappedBy = "clusterProject", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("clusterProject")
    private List<RooftopListing> contributions = new ArrayList<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "cluster_interests",
            joinColumns = @JoinColumn(name = "cluster_id"),
            inverseJoinColumns = @JoinColumn(name = "company_id")
    )
    private List<UserInfo> interestedCompanies = new ArrayList<>();
}