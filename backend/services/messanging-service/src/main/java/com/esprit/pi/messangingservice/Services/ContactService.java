package com.esprit.pi.messangingservice.Services;

import com.esprit.pi.messangingservice.DTO.ContactModelResponse;
import com.esprit.pi.messangingservice.entities.ChatUser;
import com.esprit.pi.messangingservice.repositories.ChatUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ChatUserRepository chatUserRepository;

    public List<ContactModelResponse> getContactsGrouped() {
        List<ChatUser> users = chatUserRepository.findAll();

        // Groupement par première lettre du nom (ou '#' si name null ou vide)
        Map<Character, List<ChatUser>> grouped = users.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(u -> {
                    String name = u.getName();
                    if (name == null || name.isEmpty()) {
                        return '#'; // lettre par défaut pour les noms manquants
                    }
                    return Character.toUpperCase(name.charAt(0));
                }));

        // Transformation en DTO Angular
        List<ContactModelResponse> response = new ArrayList<>();
        grouped.forEach((letter, list) -> {
            ContactModelResponse group = new ContactModelResponse();
            group.setTitle(String.valueOf(letter));

            List<ContactModelResponse.ContactItem> items = list.stream().map(user -> {
                        ContactModelResponse.ContactItem item = new ContactModelResponse.ContactItem();
                        item.setName(user.getName() != null ? user.getName() : "Utilisateur Inconnu");
                        item.setProfile(user.getImage()); // profile = image
                        return item;
                    }).sorted(Comparator.comparing(ContactModelResponse.ContactItem::getName))
                    .toList();

            group.setContacts(items);
            response.add(group);
        });

        // Optionnel : trier les groupes alphabétiquement
        response.sort(Comparator.comparing(ContactModelResponse::getTitle));

        return response;
    }
}