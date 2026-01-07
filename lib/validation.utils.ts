/**
 * Validation utilities and regex patterns for form validation
 */

// ==================== REGEX PATTERNS ====================

export const REGEX_PATTERNS = {
  // Email validation - RFC 5322 compliant
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

  // Phone numbers
  PHONE_MOROCCO: /^(\+212|0)[5-7]\d{8}$/, // Moroccan phone: +212XXXXXXXXX or 0XXXXXXXXX
  PHONE_GENERAL: /^[0-9+\s\-()]{8,20}$/, // General phone format with spaces/dashes

  // Moroccan CIN (Carte d'Identité Nationale)
  CIN_MOROCCO: /^[A-Z]{1,2}[0-9]{5,7}$/, // 1-2 letters followed by 5-7 digits

  // Names (allowing accented characters for French names)
  NAME: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/, // Letters, spaces, hyphens, apostrophes (2-50 chars)
  
  // Passwords
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, // Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special
  PASSWORD_MEDIUM: /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/, // Min 6 chars, 1 letter, 1 digit

  // Medical dosage formats
  DOSAGE: /^[0-9]+(\.[0-9]+)?\s*(mg|g|ml|L|mcg|µg|UI|%)?$/i, // e.g., "500mg", "10ml", "2.5g"

  // Numeric
  POSITIVE_INTEGER: /^[1-9]\d*$/, // Positive integers only
  POSITIVE_NUMBER: /^[0-9]+(\.[0-9]+)?$/, // Positive numbers with optional decimals
  
  // Postal code Morocco
  POSTAL_CODE_MOROCCO: /^[0-9]{5}$/, // 5 digits

  // Street address (basic)
  ADDRESS: /^[a-zA-Z0-9À-ÿ\s,.'/-]{5,200}$/, // Alphanumeric with common punctuation

  // Time formats
  TIME_24H: /^([01]\d|2[0-3]):([0-5]\d)$/, // 24-hour format HH:MM
  TIME_12H: /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/i, // 12-hour format

  // URL
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
}

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validate email address
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || !email.trim()) {
    return { valid: false, error: "L'email est obligatoire" }
  }
  if (!REGEX_PATTERNS.EMAIL.test(email)) {
    return { valid: false, error: "Format d'email invalide" }
  }
  if (email.length > 100) {
    return { valid: false, error: "L'email est trop long (max 100 caractères)" }
  }
  return { valid: true }
}

/**
 * Validate Moroccan phone number
 */
export const validatePhoneMorocco = (phone: string): { valid: boolean; error?: string } => {
  if (!phone || !phone.trim()) {
    return { valid: false, error: "Le numéro de téléphone est obligatoire" }
  }
  const cleaned = phone.replace(/[\s\-()]/g, '')
  if (!REGEX_PATTERNS.PHONE_MOROCCO.test(cleaned)) {
    return { valid: false, error: "Format de téléphone invalide (ex: 0612345678 ou +212612345678)" }
  }
  return { valid: true }
}

/**
 * Validate general phone number (more permissive)
 */
export const validatePhoneGeneral = (phone: string): { valid: boolean; error?: string } => {
  if (!phone || !phone.trim()) {
    return { valid: false, error: "Le numéro de téléphone est obligatoire" }
  }
  if (!REGEX_PATTERNS.PHONE_GENERAL.test(phone)) {
    return { valid: false, error: "Format de téléphone invalide" }
  }
  return { valid: true }
}

/**
 * Validate Moroccan CIN
 */
export const validateCIN = (cin: string): { valid: boolean; error?: string } => {
  if (!cin || !cin.trim()) {
    return { valid: false, error: "Le CIN est obligatoire" }
  }
  const cleaned = cin.toUpperCase().trim()
  if (!REGEX_PATTERNS.CIN_MOROCCO.test(cleaned)) {
    return { valid: false, error: "Format de CIN invalide (ex: AB123456)" }
  }
  return { valid: true }
}

/**
 * Validate name (first name, last name)
 */
export const validateName = (name: string, fieldName: string = "nom"): { valid: boolean; error?: string } => {
  if (!name || !name.trim()) {
    return { valid: false, error: `Le ${fieldName} est obligatoire` }
  }
  if (name.trim().length < 2) {
    return { valid: false, error: `Le ${fieldName} doit contenir au moins 2 caractères` }
  }
  if (name.trim().length > 50) {
    return { valid: false, error: `Le ${fieldName} est trop long (max 50 caractères)` }
  }
  if (!REGEX_PATTERNS.NAME.test(name.trim())) {
    return { valid: false, error: `Le ${fieldName} contient des caractères invalides` }
  }
  return { valid: true }
}

/**
 * Validate password
 */
export const validatePassword = (
  password: string,
  strength: 'strong' | 'medium' = 'medium'
): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: "Le mot de passe est obligatoire" }
  }
  
  if (strength === 'strong') {
    if (!REGEX_PATTERNS.PASSWORD_STRONG.test(password)) {
      return {
        valid: false,
        error: "Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial"
      }
    }
  } else {
    if (!REGEX_PATTERNS.PASSWORD_MEDIUM.test(password)) {
      return {
        valid: false,
        error: "Le mot de passe doit contenir au moins 6 caractères, 1 lettre et 1 chiffre"
      }
    }
  }
  
  return { valid: true }
}

/**
 * Validate date of birth
 */
export const validateDateOfBirth = (dateStr: string): { valid: boolean; error?: string } => {
  if (!dateStr) {
    return { valid: false, error: "La date de naissance est obligatoire" }
  }

  const birthDate = new Date(dateStr)
  const today = new Date()

  if (isNaN(birthDate.getTime())) {
    return { valid: false, error: "Format de date invalide" }
  }

  if (birthDate > today) {
    return { valid: false, error: "La date de naissance ne peut pas être dans le futur" }
  }

  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  const dayDiff = today.getDate() - birthDate.getDate()

  // Adjust age if birthday hasn't occurred yet this year
  const adjustedAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age

  if (adjustedAge > 150) {
    return { valid: false, error: "La date de naissance n'est pas réaliste (âge > 150 ans)" }
  }

  if (adjustedAge < 0) {
    return { valid: false, error: "La date de naissance n'est pas valide" }
  }

  return { valid: true }
}

/**
 * Validate date not in past
 */
export const validateFutureDate = (dateStr: string, fieldName: string = "date"): { valid: boolean; error?: string } => {
  if (!dateStr) {
    return { valid: false, error: `La ${fieldName} est obligatoire` }
  }

  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (isNaN(date.getTime())) {
    return { valid: false, error: "Format de date invalide" }
  }

  if (date < today) {
    return { valid: false, error: `La ${fieldName} ne peut pas être dans le passé` }
  }

  return { valid: true }
}

/**
 * Validate medication dosage
 */
export const validateDosage = (dosage: string): { valid: boolean; error?: string } => {
  if (!dosage || !dosage.trim()) {
    return { valid: false, error: "Le dosage est obligatoire" }
  }
  if (!REGEX_PATTERNS.DOSAGE.test(dosage.trim())) {
    return { valid: false, error: "Format de dosage invalide (ex: 500mg, 10ml, 2.5g)" }
  }
  return { valid: true }
}

/**
 * Validate positive number
 */
export const validatePositiveNumber = (value: string, fieldName: string = "valeur"): { valid: boolean; error?: string } => {
  if (!value || !value.trim()) {
    return { valid: false, error: `${fieldName} est obligatoire` }
  }
  if (!REGEX_PATTERNS.POSITIVE_NUMBER.test(value.trim())) {
    return { valid: false, error: `${fieldName} doit être un nombre positif` }
  }
  return { valid: true }
}

/**
 * Validate address
 */
export const validateAddress = (address: string): { valid: boolean; error?: string } => {
  if (!address || !address.trim()) {
    return { valid: false, error: "L'adresse est obligatoire" }
  }
  if (address.trim().length < 5) {
    return { valid: false, error: "L'adresse doit contenir au moins 5 caractères" }
  }
  if (address.trim().length > 200) {
    return { valid: false, error: "L'adresse est trop longue (max 200 caractères)" }
  }
  if (!REGEX_PATTERNS.ADDRESS.test(address.trim())) {
    return { valid: false, error: "L'adresse contient des caractères invalides" }
  }
  return { valid: true }
}

/**
 * Validate time in 24h format
 */
export const validateTime24h = (time: string): { valid: boolean; error?: string } => {
  if (!time || !time.trim()) {
    return { valid: false, error: "L'heure est obligatoire" }
  }
  if (!REGEX_PATTERNS.TIME_24H.test(time.trim())) {
    return { valid: false, error: "Format d'heure invalide (HH:MM, ex: 14:30)" }
  }
  return { valid: true }
}

/**
 * Validate required text field
 */
export const validateRequired = (
  value: string,
  fieldName: string,
  minLength: number = 1,
  maxLength?: number
): { valid: boolean; error?: string } => {
  if (!value || !value.trim()) {
    return { valid: false, error: `${fieldName} est obligatoire` }
  }
  if (value.trim().length < minLength) {
    return { valid: false, error: `${fieldName} doit contenir au moins ${minLength} caractères` }
  }
  if (maxLength && value.trim().length > maxLength) {
    return { valid: false, error: `${fieldName} est trop long (max ${maxLength} caractères)` }
  }
  return { valid: true }
}

/**
 * Validate URL
 */
export const validateURL = (url: string, required: boolean = false): { valid: boolean; error?: string } => {
  if (!url || !url.trim()) {
    if (required) {
      return { valid: false, error: "L'URL est obligatoire" }
    }
    return { valid: true } // Optional URL can be empty
  }
  if (!REGEX_PATTERNS.URL.test(url.trim())) {
    return { valid: false, error: "Format d'URL invalide" }
  }
  return { valid: true }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Sanitize input by trimming and removing extra spaces
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ')
}

/**
 * Format phone number for display (Moroccan format)
 */
export const formatPhoneMorocco = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  if (cleaned.startsWith('+212')) {
    return `+212 ${cleaned.slice(4, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)} ${cleaned.slice(11)}`
  }
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `0${cleaned.slice(1, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`
  }
  return phone
}

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: string): number => {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}
