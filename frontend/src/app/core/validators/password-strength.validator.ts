import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates password strength:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }

    const value = control.value as string;
    const errors: ValidationErrors = {};

    // Minimum length
    if (value.length < 8) {
      errors['minLength'] = { requiredLength: 8, actualLength: value.length };
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(value)) {
      errors['hasUppercase'] = true;
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(value)) {
      errors['hasLowercase'] = true;
    }

    // At least one digit
    if (!/[0-9]/.test(value)) {
      errors['hasDigit'] = true;
    }

    // At least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(value)) {
      errors['hasSpecialChar'] = true;
    }

    return Object.keys(errors).length > 0 ? { passwordStrength: errors } : null;
  };
}
