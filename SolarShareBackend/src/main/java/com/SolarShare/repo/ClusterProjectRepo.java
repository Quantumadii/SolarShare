package com.SolarShare.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.SolarShare.model.ClusterProject;
import com.SolarShare.model.UserInfo;

public interface ClusterProjectRepo extends JpaRepository<ClusterProject, Long> {
    List<ClusterProject> findByCityIgnoreCase(String city);
    List<ClusterProject> findByCreatorAndIsFullFalse(UserInfo creator);
    List<ClusterProject> findByIsFullFalse();
}