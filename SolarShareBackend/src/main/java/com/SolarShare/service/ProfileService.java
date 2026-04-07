package com.SolarShare.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.SolarShare.model.UserInfo;
import com.SolarShare.repo.UserInfoRepository;

@Service
public class ProfileService {

    @Autowired
    private UserInfoRepository userInfoRepo;

    public UserInfo getProfile(String username) {
        UserInfo info = userInfoRepo.findByUserUsername(username);
        return info;
    }
}
