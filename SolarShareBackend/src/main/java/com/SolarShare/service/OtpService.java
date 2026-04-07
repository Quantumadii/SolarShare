package com.SolarShare.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.SolarShare.model.EmailOtp;
import com.SolarShare.repo.EmailOtpRepository;

@Service
public class OtpService {

    private static final String SIGNUP_PURPOSE = "SIGNUP";

    private final EmailOtpRepository emailOtpRepository;
    private final EmailNotificationService emailNotificationService;

    @Value("${app.otp.expiry-minutes:10}")
    private long otpExpiryMinutes;

    @Value("${app.otp.require-verification:false}")
    private boolean otpVerificationRequired;

    public OtpService(EmailOtpRepository emailOtpRepository, EmailNotificationService emailNotificationService) {
        this.emailOtpRepository = emailOtpRepository;
        this.emailNotificationService = emailNotificationService;
    }

    public void generateAndSendSignupOtp(String email) {
        String normalizedEmail = normalizeEmail(email);
        String otp = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 999999));

        EmailOtp record = new EmailOtp();
        record.setEmail(normalizedEmail);
        record.setOtpCode(otp);
        record.setPurpose(SIGNUP_PURPOSE);
        record.setCreatedAt(LocalDateTime.now());
        record.setExpiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        record.setVerified(false);

        emailOtpRepository.save(record);
        emailNotificationService.sendOtpEmail(normalizedEmail, otp);
    }

    public boolean verifySignupOtp(String email, String otp) {
        String normalizedEmail = normalizeEmail(email);
        Optional<EmailOtp> optionalOtp = emailOtpRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(normalizedEmail, SIGNUP_PURPOSE);

        if (optionalOtp.isEmpty()) {
            return false;
        }

        EmailOtp record = optionalOtp.get();
        boolean valid = !record.isVerified()
                && record.getExpiresAt().isAfter(LocalDateTime.now())
                && record.getOtpCode().equals(otp);

        if (valid) {
            record.setVerified(true);
            emailOtpRepository.save(record);
        }

        return valid;
    }

    public boolean isSignupOtpVerified(String email) {
        if (!otpVerificationRequired) {
            return true;
        }

        String normalizedEmail = normalizeEmail(email);
        Optional<EmailOtp> optionalOtp = emailOtpRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(normalizedEmail, SIGNUP_PURPOSE);

        if (optionalOtp.isEmpty()) {
            return false;
        }

        EmailOtp record = optionalOtp.get();
        return record.isVerified() && record.getExpiresAt().isAfter(LocalDateTime.now());
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        return email.trim().toLowerCase();
    }
}
