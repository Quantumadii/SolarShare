package com.SolarShare.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.SolarShare.dto.OtpRequest;
import com.SolarShare.dto.OtpVerificationRequest;
import com.SolarShare.dto.SignupRequest;
import com.SolarShare.model.User;
import com.SolarShare.service.JwtService;
import com.SolarShare.service.OtpService;
import com.SolarShare.service.UserRegistrationService;

@RestController
//@CrossOrigin(originPatterns = "*")
public class UserController {

    @Autowired
    private UserRegistrationService service;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private OtpService otpService;

    @PostMapping("/register/request-otp")
    public ResponseEntity<String> requestOtp(@RequestBody OtpRequest request) {
        try {
            otpService.generateAndSendSignupOtp(request.getEmail());
            return ResponseEntity.ok("OTP sent successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Could not send OTP: " + e.getMessage());
        }
    }

    @PostMapping("/register/verify-otp")
    public ResponseEntity<String> verifyOtp(@RequestBody OtpVerificationRequest request) {
        boolean isVerified = otpService.verifySignupOtp(request.getEmail(), request.getOtp());
        if (isVerified) {
            return ResponseEntity.ok("OTP verified successfully");
        }
        return ResponseEntity.badRequest().body("Invalid or expired OTP");
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody SignupRequest signupRequest) {
        try {
            service.registerNewUser(signupRequest);
            return ResponseEntity.ok("User registered successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public String login(@RequestBody User user){
        Authentication authentication=authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(user.getUsername(),user.getPassword()));
        if(authentication.isAuthenticated()){
            return jwtService.generateToken(user.getUsername());
        }else{
            return "Fail";
        }
    }
}
