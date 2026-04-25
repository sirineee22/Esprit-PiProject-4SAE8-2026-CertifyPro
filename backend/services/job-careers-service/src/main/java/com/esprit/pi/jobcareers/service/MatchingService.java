package com.esprit.pi.jobcareers.service;

import com.esprit.pi.jobcareers.dto.response.JobMatchResponse;
import com.esprit.pi.jobcareers.enums.JobStatus;
import com.esprit.pi.jobcareers.model.Candidate;
import com.esprit.pi.jobcareers.model.JobOffer;
import com.esprit.pi.jobcareers.repository.CandidateRepository;
import com.esprit.pi.jobcareers.repository.JobOfferRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Matching Service — comment ça marche :
 *
 * 1. On récupère le profil candidat (ses skills + certifications)
 * 2. On récupère toutes les offres ACTIVE
 * 3. Pour chaque offre, on calcule un score de matching :
 *    - On compare les skills du candidat (en lowercase) avec les tags de l'offre
 *    - On compare aussi avec le titre et la description de l'offre
 *    - Score = (nb de correspondances / max(nb skills, nb tags)) × 100
 *    - Bonus : +10 si le jobTitle du candidat correspond au titre de l'offre
 *    - Score plafonné à 100
 * 4. On trie par score décroissant et on retourne les N meilleures offres
 * 5. Si le candidat n'a pas de profil ou pas de skills → on retourne les offres
 *    les plus récentes avec un score de 0 (fallback)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MatchingService {

    private final CandidateRepository candidateRepository;
    private final JobOfferRepository  jobOfferRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public List<JobMatchResponse> getRecommendations(Long userId, int limit) {

        // ── 1. Récupérer le candidat ──────────────────────────────────────
        Optional<Candidate> candidateOpt = candidateRepository.findByUserId(userId);

        List<String> candidateSkills = new ArrayList<>();
        String       candidateTitle  = "";

        if (candidateOpt.isPresent()) {
            Candidate c = candidateOpt.get();
            if (c.getSkills() != null)         candidateSkills.addAll(c.getSkills());
            if (c.getCertifications() != null) candidateSkills.addAll(c.getCertifications());
            if (c.getJobTitle() != null)       candidateTitle = c.getJobTitle().toLowerCase();
        }

        // Normaliser en lowercase
        final List<String> skillsLower = candidateSkills.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toList());

        final String titleLower = candidateTitle;

        // ── 2. Récupérer les offres actives ───────────────────────────────
        List<JobOffer> activeOffers = jobOfferRepository.findByStatus(JobStatus.ACTIVE);

        if (activeOffers.isEmpty()) return Collections.emptyList();

        // ── 3. Calculer le score pour chaque offre ────────────────────────
        List<JobMatchResponse> scored = activeOffers.stream()
                .map(offer -> {
                    int score = computeScore(offer, skillsLower, titleLower);
                    return buildResponse(offer, score);
                })
                .sorted(Comparator.comparingInt(JobMatchResponse::getMatchScore).reversed())
                .limit(limit)
                .collect(Collectors.toList());

        log.info("Matching for userId={}: {} offers scored, returning top {}", userId, activeOffers.size(), limit);
        return scored;
    }

    // ── Score calculation ─────────────────────────────────────────────────
    private int computeScore(JobOffer offer, List<String> skillsLower, String candidateTitle) {

        if (skillsLower.isEmpty()) {
            // Pas de skills → score basé sur popularité (applicationCount)
            int pop = offer.getApplicationCount() != null ? offer.getApplicationCount() : 0;
            return Math.min(pop * 2, 30); // max 30% pour les offres populaires sans matching
        }

        // Tags de l'offre normalisés
        List<String> tagsLower = offer.getTags() == null ? Collections.emptyList() :
                offer.getTags().stream()
                        .filter(t -> t != null && !t.isBlank())
                        .map(String::toLowerCase)
                        .collect(Collectors.toList());

        // Texte de l'offre pour matching partiel
        String offerText = ((offer.getTitle()       != null ? offer.getTitle()       : "") + " " +
                            (offer.getDescription() != null ? offer.getDescription() : "") + " " +
                            (offer.getPosition()    != null ? offer.getPosition()    : "")).toLowerCase();

        // Compter les correspondances exactes (tags)
        long exactMatches = skillsLower.stream()
                .filter(tagsLower::contains)
                .count();

        // Compter les correspondances partielles (dans le texte de l'offre)
        long partialMatches = skillsLower.stream()
                .filter(skill -> offerText.contains(skill))
                .count();

        // Score de base
        int denominator = Math.max(skillsLower.size(), Math.max(tagsLower.size(), 1));
        double baseScore = ((exactMatches * 1.0 + partialMatches * 0.5) / denominator) * 100.0;

        // Bonus titre
        int titleBonus = 0;
        if (!candidateTitle.isEmpty() && offer.getTitle() != null &&
                offer.getTitle().toLowerCase().contains(candidateTitle)) {
            titleBonus = 15;
        }

        // Bonus offre urgente/featured
        int urgentBonus = Boolean.TRUE.equals(offer.getIsUrgent())   ? 5 : 0;
        int featBonus   = Boolean.TRUE.equals(offer.getIsFeatured()) ? 3 : 0;

        return Math.min((int) Math.round(baseScore) + titleBonus + urgentBonus + featBonus, 100);
    }

    private JobMatchResponse buildResponse(JobOffer offer, int score) {
        String companyName = offer.getCompany() != null ? offer.getCompany().getName() : "Entreprise inconnue";
        String postDate    = offer.getPostDate() != null ? offer.getPostDate().format(DATE_FMT) : "";

        List<String> cleanTags = offer.getTags() == null ? Collections.emptyList() :
                offer.getTags().stream()
                        .filter(t -> t != null && !t.isBlank())
                        .collect(Collectors.toList());

        return JobMatchResponse.builder()
                .jobId(offer.getId())
                .title(offer.getTitle())
                .company(companyName)
                .location(offer.getLocation() != null ? offer.getLocation() : offer.getState())
                .country(offer.getCountry())
                .contractType(offer.getContractType() != null ? offer.getContractType().name() : null)
                .isRemote(offer.getIsRemote())
                .isUrgent(offer.getIsUrgent())
                .tags(cleanTags)
                .matchScore(score)
                .postDate(postDate)
                .build();
    }

    // ── Feature 3 : Matching bidirectionnel ──────────────────────────────
    // Employer → Candidats suggérés pour une offre donnée
    public List<com.esprit.pi.jobcareers.dto.response.CandidateMatchResponse>
            getMatchingCandidates(Long jobOfferId, int limit) {

        JobOffer offer = jobOfferRepository.findById(jobOfferId).orElse(null);
        if (offer == null) return Collections.emptyList();

        // Tags de l'offre normalisés
        final List<String> tagsLower = offer.getTags() == null ? Collections.emptyList() :
                offer.getTags().stream()
                        .filter(t -> t != null && !t.isBlank())
                        .map(String::toLowerCase)
                        .collect(Collectors.toList());

        final String offerText = ((offer.getTitle()       != null ? offer.getTitle()       : "") + " " +
                                  (offer.getDescription() != null ? offer.getDescription() : "")).toLowerCase();

        // Tous les candidats avec un profil
        List<Candidate> candidates = candidateRepository.findAll();

        return candidates.stream()
                .filter(c -> c.getSkills() != null && !c.getSkills().isEmpty())
                .map(c -> {
                    List<String> skillsLower = c.getSkills().stream()
                            .map(String::toLowerCase).collect(Collectors.toList());

                    // Skills matchées
                    List<String> matched = skillsLower.stream()
                            .filter(s -> tagsLower.contains(s) || offerText.contains(s))
                            .map(s -> c.getSkills().get(skillsLower.indexOf(s)))
                            .collect(Collectors.toList());

                    int score = tagsLower.isEmpty() ? 0 :
                            Math.min((int) Math.round((matched.size() * 1.0 / tagsLower.size()) * 100), 100);

                    return com.esprit.pi.jobcareers.dto.response.CandidateMatchResponse.builder()
                            .candidateId(c.getId())
                            .userId(c.getUserId())
                            .firstName(c.getFirstName())
                            .lastName(c.getLastName())
                            .fullName((c.getFirstName() != null ? c.getFirstName() : "") + " " +
                                      (c.getLastName()  != null ? c.getLastName()  : ""))
                            .jobTitle(c.getJobTitle())
                            .location(c.getLocation())
                            .country(c.getCountry())
                            .resumeUrl(c.getResumeUrl())
                            .linkedinUrl(c.getLinkedinUrl())
                            .skills(c.getSkills())
                            .certifications(c.getCertifications())
                            .matchScore(score)
                            .matchedSkills(matched)
                            .build();
                })
                .filter(r -> r.getMatchScore() > 0)
                .sorted(Comparator.comparingInt(
                        com.esprit.pi.jobcareers.dto.response.CandidateMatchResponse::getMatchScore).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }
}
