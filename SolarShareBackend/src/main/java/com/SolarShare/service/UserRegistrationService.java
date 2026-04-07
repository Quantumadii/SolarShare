package com.SolarShare.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.SolarShare.dto.SignupRequest;
import com.SolarShare.model.User;
import com.SolarShare.model.UserInfo;
import com.SolarShare.model.UserType;
import com.SolarShare.repo.UserInfoRepository;
import com.SolarShare.repo.UserRepo;

import jakarta.transaction.Transactional;

@Service
public class UserRegistrationService {
    @Autowired
    private UserRepo repo;

    @Autowired
    private UserInfoRepository userInfoRepo;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailNotificationService emailNotificationService;

    private BCryptPasswordEncoder encoder=new BCryptPasswordEncoder(12);

    @Transactional
    public void registerNewUser(SignupRequest request) {
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        String email = request.getUsername().trim().toLowerCase();

        if (!otpService.isSignupOtpVerified(email)) {
            throw new IllegalArgumentException("Please verify OTP before completing registration");
        }

        if (repo.findByUsername(email) != null) {
            throw new IllegalArgumentException("User already exists with this email");
        }

        User user = new User();
        user.setUsername(email);
        user.setPassword(encoder.encode(request.getPassword()));

        User savedUser = repo.save(user);

        UserInfo info = new UserInfo();
        info.setFullName(request.getFullName());
        info.setPhoneNumber(request.getPhoneNumber());
        info.setCity(request.getCity());

        String typeStr = request.getUserType();

        if (typeStr != null && typeStr.equalsIgnoreCase("SOLAR_COMPANY")) {
            info.setType(UserType.SOLAR_COMPANY);
            if (request.getCompanyName() == null || request.getCompanyName().isBlank()) {
                throw new IllegalArgumentException("Company name is required for solar company accounts");
            }
            info.setCompanyName(request.getCompanyName().trim());
        } else {
            info.setType(UserType.HOMEOWNER);
            info.setCompanyName(null);
        }
        info.setUser(savedUser);

        userInfoRepo.save(info);

        String displayName = info.getType() == UserType.SOLAR_COMPANY
                ? info.getCompanyName()
                : info.getFullName();
        emailNotificationService.sendWelcomeEmail(email, displayName);
    }
}
