package com.training.platform.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    private static final String BASE_TEMPLATE = 
        "<!DOCTYPE html>" +
        "<html>" +
        "<head>" +
        "    <style>" +
        "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }" +
        "        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }" +
        "        .header { background-color: #1e293b; padding: 30px; text-align: center; }" +
        "        .logo { color: #f97316; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }" +
        "        .content { padding: 40px; }" +
        "        .title { color: #1e293b; font-size: 24px; font-weight: 700; margin-bottom: 20px; }" +
        "        .message { margin-bottom: 30px; font-size: 16px; color: #475569; }" +
        "        .btn-container { text-align: center; margin: 30px 0; }" +
        "        .btn { background-color: #f97316; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; transition: background-color 0.3s; }" +
        "        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }" +
        "        .highlight { color: #f97316; font-weight: 600; }" +
        "    </style>" +
        "</head>" +
        "<body>" +
        "    <div class='container'>" +
        "        <div class='header'>" +
        "            <div class='logo'>Certify<span style='color: #ffffff;'>Pro</span></div>" +
        "        </div>" +
        "        <div class='content'>" +
        "            <div class='title'>{{TITLE}}</div>" +
        "            <div class='message'>{{CONTENT}}</div>" +
        "            {{BUTTON}}" +
        "        </div>" +
        "        <div class='footer'>" +
        "            &copy; 2024 CertifyPro Global Enterprise<br>" +
        "            Plateforme de formation professionnelle et événementielle.<br>" +
        "            Si vous n'êtes pas à l'origine de ce message, veuillez l'ignorer." +
        "        </div>" +
        "    </div>" +
        "</body>" +
        "</html>";

    private String applyTemplate(String title, String content, String buttonText, String buttonUrl) {
        String buttonHtml = "";
        if (buttonText != null && buttonUrl != null) {
            buttonHtml = "<div class='btn-container'><a href='" + buttonUrl + "' class='btn'>" + buttonText + "</a></div>";
        }
        
        return BASE_TEMPLATE
                .replace("{{TITLE}}", title)
                .replace("{{CONTENT}}", content)
                .replace("{{BUTTON}}", buttonHtml);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom("hello@certifypro.com"); 
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); 
            
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendWelcomeEmail(String to, String firstName) {
        String title = "Bienvenue chez CertifyPro !";
        String content = "Bonjour <span class='highlight'>" + (firstName != null ? firstName : "") + "</span>,<br><br>" +
                "Nous sommes ravis de vous accueillir sur notre plateforme. Votre inscription a été confirmée avec succès.<br><br>" +
                "Vous pouvez dès à présent explorer nos formations et vous inscrire aux événements qui vous intéressent.";
        
        String htmlBody = applyTemplate(title, content, "Accéder à mon compte", "http://localhost:4200/login");
        sendHtmlEmail(to, title, htmlBody);
    }

    @Async
    public void sendTrainerApprovalEmail(String to, String firstName) {
        String title = "Félicitations, Formateur !";
        String content = "Bonjour <span class='highlight'>" + (firstName != null ? firstName : "") + "</span>,<br><br>" +
                "Votre demande pour devenir formateur a été <span style='color: #10b981; font-weight: 600;'>approuvée</span> par notre équipe.<br><br>" +
                "Vous avez maintenant accès à des outils avancés pour créer et gérer vos propres événements.";
        
        String htmlBody = applyTemplate(title, content, "Accéder au tableau de bord", "http://localhost:4200/trainer/events");
        sendHtmlEmail(to, title, htmlBody);
    }

    @Async
    public void sendTrainerRejectionEmail(String to, String firstName) {
        String title = "Mise à jour de votre demande";
        String content = "Bonjour <span class='highlight'>" + (firstName != null ? firstName : "") + "</span>,<br><br>" +
                "Nous avons bien reçu votre demande pour devenir formateur. Après étude de votre dossier, nous ne pouvons pas l'approuver pour le moment.<br><br>" +
                "N'hésitez pas à enrichir votre profil et à retenter votre chance d'ici quelques temps.";
        
        String htmlBody = applyTemplate(title, content, "Consulter mon profil", "http://localhost:4200/profile");
        sendHtmlEmail(to, title, htmlBody);
    }

    @Async
    public void sendEventCancellationEmail(String to, String firstName, String eventTitle) {
        String title = "Événement Annulé";
        String content = "Bonjour <span class='highlight'>" + (firstName != null ? firstName : "") + "</span>,<br><br>" +
                "Nous avons le regret de vous informer que l'événement <span class='highlight'>\"" + eventTitle + "\"</span> auquel vous étiez inscrit(e) a été annulé par son formateur.<br><br>" +
                "Nous vous invitons à consulter nos autres événements disponibles sur la plateforme.";
        
        String htmlBody = applyTemplate(title, content, "Explorer d'autres événements", "http://localhost:4200/events");
        sendHtmlEmail(to, "Notification d'annulation : " + eventTitle, htmlBody);
    }

    @Async
    public void sendGenericNotificationEmail(String to, String firstName, String title, String message) {
        String content = "Bonjour <span class='highlight'>" + (firstName != null ? firstName : "") + "</span>,<br><br>" +
                message;
        String htmlBody = applyTemplate(title, content, "Voir mes événements", "http://localhost:4200/events");
        sendHtmlEmail(to, title, htmlBody);
    }
}
