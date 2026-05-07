package com.training.platform.dto;

import com.training.platform.entity.Role;
import com.training.platform.validation.PasswordStrength;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * DTO for PUT /api/users/{id}. All fields optional; password validated only when provided.
 */
public class UpdateUserRequest {

    @Size(max = 50)
    private String firstName;

    @Size(max = 50)
    private String lastName;

    @Size(max = 50)
    @Email
    private String email;

    @jakarta.validation.constraints.Pattern(regexp = "^(\\+\\d{1,3}[- ]?)?\\d{8,12}$", message = "Format de numéro de téléphone invalide")
    private String phoneNumber;

    @Size(max = 500)
    private String profileImageUrl;

    private Boolean active;

    private Role role;

    @Size(max = 120)
    @PasswordStrength
    private String password;

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
