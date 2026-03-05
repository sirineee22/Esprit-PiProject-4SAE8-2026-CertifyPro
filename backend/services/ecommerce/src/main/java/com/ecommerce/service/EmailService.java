package com.ecommerce.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender){
        this.mailSender = mailSender;
    }

    public void sendOrderConfirmation(String to, Long orderId, String customerName){

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject("Order Confirmation - #" + orderId);

        message.setText(
                "Hello " + customerName + ",\n\n" +
                        "Thank you for your order.\n\n" +
                        "Your order #" + orderId + " has been successfully received.\n" +
                        "We will process it shortly.\n\n" +
                        "Best regards,\n" +
                        "Certify PRO Team\n"

        );

        message.setFrom("contact@longevityplus.store");

        mailSender.send(message);
    }
}