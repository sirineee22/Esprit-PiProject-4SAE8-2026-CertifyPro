package com.training.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.training.platform.validation.PasswordStrength;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(min = 2, max = 50)
    private String firstName;

    @NotBlank
    @Size(min = 2, max = 50)
    private String lastName;

    @NotBlank
    @Size(max = 50)
    @Email
    @Column(unique = true)
    private String email;

    @NotBlank
    @Size(max = 120)
    @PasswordStrength
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @jakarta.validation.constraints.Pattern(regexp = "^(\\+\\d{1,3}[- ]?)?\\d{8,12}$", message = "Format de numéro de téléphone invalide")
    private String phoneNumber;

    @Size(max = 500)
    @Column(name = "profile_image_url")
    private String profileImageUrl;

    private Boolean active = true;

    public boolean isActive() {
        return Boolean.TRUE.equals(this.active);
    }

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;

    @Column(name = "last_login")
    private java.time.Instant lastLogin;

    @Column(name = "last_activity_at")
    private java.time.Instant lastActivityAt;

    private Boolean twoFactorEnabled = false;

    public boolean isTwoFactorEnabled() {
        return Boolean.TRUE.equals(this.twoFactorEnabled);
    }

    @Column(name = "two_factor_secret")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String twoFactorSecret;
}
