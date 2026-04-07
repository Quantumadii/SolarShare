package com.SolarShare.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.SolarShare.model.EmailOtp;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {
    Optional<EmailOtp> findTopByEmailAndPurposeOrderByCreatedAtDesc(String email, String purpose);
}
