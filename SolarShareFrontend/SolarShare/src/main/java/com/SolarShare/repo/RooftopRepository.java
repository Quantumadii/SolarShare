package com.SolarShare.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.SolarShare.model.ClusterProject;
import com.SolarShare.model.RooftopListing;
import com.SolarShare.model.UserInfo;

public interface RooftopRepository extends JpaRepository<RooftopListing, Long> {
    List<RooftopListing> findByCity(String city);
    List<RooftopListing> findByOwner(UserInfo owner);
    List<RooftopListing> findByClusterProject(ClusterProject clusterProject);
    List<RooftopListing> findByClusterProjectNull();
}