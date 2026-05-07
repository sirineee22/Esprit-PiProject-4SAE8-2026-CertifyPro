package com.training.platform.service;

import com.training.platform.dto.AiFeedbackRequestDTO;
import com.training.platform.dto.AiFeedbackResponseDTO;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class AiFeedbackMockService {

    public AiFeedbackResponseDTO generateFeedback(AiFeedbackRequestDTO request) {
        // Apportons une petite latence artificielle (1.5 secondes) pour simuler 
        // exactement l'effet d'une IA ("L'IA réfléchit...") au Frontend.
        try {
            TimeUnit.MILLISECONDS.sleep(1500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        String title = request.getFormationTitle() != null ? request.getFormationTitle() : "cette formation";
        Double score = request.getScore();
        String keywords = request.getShortKeywords() != null ? request.getShortKeywords().trim() : "";

        StringBuilder feedbackBuilder = new StringBuilder();

        // 1. Introduction d'encouragement basée sur le Score
        if (score >= 80) {
            feedbackBuilder.append("Félicitations pour cet excellent résultat à la formation ").append(title).append(". Vous avez démontré une solide maîtrise des concepts abordés. ");
        } else if (score >= 50) {
            feedbackBuilder.append("Bon travail dans l'ensemble sur la formation ").append(title).append(". Les bases sont acquises, bien qu'il reste encore une marge de progression. ");
        } else {
            feedbackBuilder.append("Le résultat à la formation ").append(title).append(" indique qu'il faut redoubler d'efforts. Ne vous découragez pas, la maîtrise viendra avec la pratique. ");
        }

        // 2. Intégration naturelle des keywords du formateur
        if (!keywords.isEmpty()) {
            feedbackBuilder.append("Concernant les détails de l'évaluation, je tiens à souligner ces points : ");
            feedbackBuilder.append(keywords).append(". ");
        }

        // 3. Conclusion structurée (Actionnable)
        if (score >= 80) {
            feedbackBuilder.append("Continuez sur cette dynamique très positive et n'hésitez pas à vous attaquer à des modules plus complexes pour approfondir vos connaissances.");
        } else if (score >= 50) {
            feedbackBuilder.append("Je vous conseille de revoir les points mentionnés précédemment en pratiquant davantage pour consolider vos acquis avant de passer au niveau supérieur.");
        } else {
            feedbackBuilder.append("Il serait bénéfique de revoir l'intégralité du cours. N'hésitez pas à me solliciter (le formateur) si vous avez des blocages spécifiques.");
        }

        return AiFeedbackResponseDTO.builder()
                .generatedFeedback(feedbackBuilder.toString())
                .build();
    }
}
