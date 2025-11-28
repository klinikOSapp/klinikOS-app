export const DEFAULT_LOCALE = 'es-ES'
export const DEFAULT_TIMEZONE = 'Europe/Madrid'

/**
 * Phone number utilities for E.164 format
 */

/**
 * Normalizes a phone number to E.164 format.
 * E.164 format: +[country code][number], e.g., +34600123456
 * 
 * @param phone - The phone number to normalize
 * @param defaultCountryCode - Default country code if none provided (default: '+34' for Spain)
 * @returns Normalized phone number in E.164 format, or null if invalid
 */
export function normalizeToE164(
  phone: string | null | undefined,
  defaultCountryCode = '+34'
): string | null {
  if (!phone) return null
  
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // If starts with +, keep it
  if (cleaned.startsWith('+')) {
    // Validate it has enough digits (at least 8 after country code)
    const digits = cleaned.slice(1)
    if (digits.length >= 8 && digits.length <= 15) {
      return cleaned
    }
    return null
  }
  
  // If starts with 00 (international prefix), replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2)
    const digits = cleaned.slice(1)
    if (digits.length >= 8 && digits.length <= 15) {
      return cleaned
    }
    return null
  }
  
  // Check if it looks like it already has a country code (11+ digits)
  if (cleaned.length >= 11 && cleaned.length <= 15) {
    // Probably already has country code, just add +
    return '+' + cleaned
  }
  
  // Otherwise, add default country code
  if (cleaned.length >= 6 && cleaned.length <= 12) {
    // Remove leading 0 if present (common in local formats)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1)
    }
    return defaultCountryCode + cleaned
  }
  
  return null
}

/**
 * Validates if a phone number is in E.164 format
 */
export function isValidE164(phone: string | null | undefined): boolean {
  if (!phone) return false
  // E.164: + followed by 8-15 digits
  return /^\+[1-9]\d{7,14}$/.test(phone)
}

/**
 * Formats a phone number for display (adds spaces for readability)
 * @param phone - Phone number in E.164 format
 * @returns Formatted phone number, e.g., "+34 600 123 456"
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) return '—'
  if (!phone.startsWith('+')) return phone
  
  // Try to format based on common patterns
  const digits = phone.slice(1)
  
  // Spanish format: +34 XXX XXX XXX
  if (digits.startsWith('34') && digits.length === 11) {
    return `+34 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  }
  
  // Finnish format: +358 XX XXX XXXX
  if (digits.startsWith('358')) {
    const local = digits.slice(3)
    if (local.length >= 9) {
      return `+358 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`
    }
  }
  
  // Generic format: +CC XXX XXX XXXX
  if (digits.length >= 10) {
    const countryCodeLen = digits.length > 11 ? 2 : (digits.length > 10 ? 1 : 2)
    const cc = digits.slice(0, countryCodeLen)
    const rest = digits.slice(countryCodeLen)
    const parts = rest.match(/.{1,3}/g) || [rest]
    return `+${cc} ${parts.join(' ')}`
  }
  
  return phone
}

