package com.SolarShare.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.SolarShare.model.RooftopListing;
import com.SolarShare.model.UserInfo;
import com.SolarShare.model.UserType;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailNotificationService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from:${spring.mail.username:solarshare.energy@gmail.com}}")
    private String fromEmail;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    public EmailNotificationService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    public void sendOtpEmail(String toEmail, String otp) {
        Context context = new Context();
        context.setVariable("otp", otp);
        context.setVariable("email", toEmail);
        sendHtml(toEmail, "SolarShare OTP Verification", "mail/otp-email", context);
    }

    public void sendWelcomeEmail(String toEmail, String fullName) {
        Context context = new Context();
        context.setVariable("fullName", fullName);
        sendHtml(toEmail, "Welcome to SolarShare", "mail/welcome-email", context);
    }

    public void sendListingCreatedEmail(UserInfo owner, RooftopListing listing) {
        if (owner == null || owner.getUser() == null) {
            return;
        }
        Context context = new Context();
        context.setVariable("ownerName", owner.getFullName());
        context.setVariable("address", listing.getAddress());
        context.setVariable("city", listing.getCity());
        context.setVariable("area", listing.getAreaSquareFt());
        context.setVariable("rent", listing.getExpectedRent());
        sendHtml(owner.getUser().getUsername(), "Rooftop listing created successfully", "mail/listing-created-email", context);
    }

    public void sendInterestNotificationEmail(UserInfo owner, UserInfo company, RooftopListing listing) {
        if (owner == null || owner.getUser() == null || company == null || company.getUser() == null) {
            return;
        }
        Context context = new Context();
        context.setVariable("ownerName", owner.getFullName());
        context.setVariable("companyName", resolveDisplayName(company));
        context.setVariable("address", listing.getAddress());
        context.setVariable("city", listing.getCity());
        sendHtml(owner.getUser().getUsername(), "New company interest on your rooftop listing", "mail/listing-interest-email", context);
    }

    public void sendListingAcceptedEmails(UserInfo owner, UserInfo company, RooftopListing listing) {
        if (owner == null || owner.getUser() == null || company == null || company.getUser() == null) {
            return;
        }

        Context ownerContext = new Context();
        ownerContext.setVariable("recipientName", owner.getFullName());
        ownerContext.setVariable("counterpartyName", resolveDisplayName(company));
        ownerContext.setVariable("address", listing.getAddress());
        ownerContext.setVariable("city", listing.getCity());
        ownerContext.setVariable("role", "Homeowner");
        sendHtml(owner.getUser().getUsername(), "Rooftop accepted and rent agreement generated", "mail/listing-accepted-email", ownerContext);

        Context companyContext = new Context();
        companyContext.setVariable("recipientName", resolveDisplayName(company));
        companyContext.setVariable("counterpartyName", owner.getFullName());
        companyContext.setVariable("address", listing.getAddress());
        companyContext.setVariable("city", listing.getCity());
        companyContext.setVariable("role", "Solar Company");
        sendHtml(company.getUser().getUsername(), "Rooftop accepted and rent agreement generated", "mail/listing-accepted-email", companyContext);
    }

    private String resolveDisplayName(UserInfo user) {
        if (user == null) {
            return "N/A";
        }
        if (user.getType() == UserType.SOLAR_COMPANY && user.getCompanyName() != null && !user.getCompanyName().isBlank()) {
            return user.getCompanyName();
        }
        return user.getFullName();
    }

    private void sendHtml(String toEmail, String subject, String template, Context context) {
        if (!mailEnabled || toEmail == null || toEmail.isBlank()) {
            return;
        }

        try {
            String htmlContent = templateEngine.process(template, context);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException | MailException e) {
            // Avoid interrupting core API flow due to email delivery issues.
            System.err.println("Email send failed: " + e.getMessage());
        }
    }
}
