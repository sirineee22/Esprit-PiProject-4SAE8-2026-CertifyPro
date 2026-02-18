package com.training.platform.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordStrengthValidator implements ConstraintValidator<PasswordStrength, String> {

    @Override
    public void initialize(PasswordStrength constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isBlank()) {
            return true; // Let @NotBlank handle empty passwords
        }

        // Minimum length
        if (password.length() < 8) {
            return false;
        }

        // At least one uppercase letter
        boolean hasUppercase = password.chars().anyMatch(Character::isUpperCase);
        if (!hasUppercase) {
            return false;
        }

        // At least one lowercase letter
        boolean hasLowercase = password.chars().anyMatch(Character::isLowerCase);
        if (!hasLowercase) {
            return false;
        }

        // At least one digit
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        if (!hasDigit) {
            return false;
        }

        // At least one special character
        boolean hasSpecialChar = password.chars()
                .anyMatch(ch -> !Character.isLetterOrDigit(ch));
        if (!hasSpecialChar) {
            return false;
        }

        return true;
    }
}
