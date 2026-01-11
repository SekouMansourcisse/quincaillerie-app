import { useState, useCallback } from 'react';

export interface ValidationRules {
  [key: string]: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

export interface ValidationErrors {
  [key: string]: string;
}

export const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback((name: string, value: any): string | null => {
    const fieldRules = rules[name];
    if (!fieldRules) return null;

    // Required
    if (fieldRules.required && (!value || value === '')) {
      return 'Ce champ est requis';
    }

    // Si le champ est vide et pas requis, pas d'autres validations
    if (!value || value === '') return null;

    // Min (pour les nombres)
    if (fieldRules.min !== undefined && parseFloat(value) < fieldRules.min) {
      return `La valeur doit être supérieure ou égale à ${fieldRules.min}`;
    }

    // Max (pour les nombres)
    if (fieldRules.max !== undefined && parseFloat(value) > fieldRules.max) {
      return `La valeur doit être inférieure ou égale à ${fieldRules.max}`;
    }

    // MinLength (pour les strings)
    if (fieldRules.minLength !== undefined && value.length < fieldRules.minLength) {
      return `Minimum ${fieldRules.minLength} caractères requis`;
    }

    // MaxLength (pour les strings)
    if (fieldRules.maxLength !== undefined && value.length > fieldRules.maxLength) {
      return `Maximum ${fieldRules.maxLength} caractères autorisés`;
    }

    // Pattern
    if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
      return 'Format invalide';
    }

    // Custom validation
    if (fieldRules.custom) {
      return fieldRules.custom(value);
    }

    return null;
  }, [rules]);

  const validateForm = useCallback((data: any): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(rules).forEach((fieldName) => {
      const error = validateField(fieldName, data[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules, validateField]);

  const handleBlur = useCallback((name: string, value: any) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error || ''
    }));
  }, [validateField]);

  const handleChange = useCallback((name: string, value: any) => {
    // Valider seulement si le champ a déjà été touché
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error || ''
      }));
    }
  }, [touched, validateField]);

  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    validateForm,
    validateField,
    handleBlur,
    handleChange,
    resetValidation
  };
};
