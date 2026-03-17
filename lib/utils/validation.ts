const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[0-9\s()-]{7,20}$/

export function normalizeInput(value: string) {
  return value.trim()
}

export function validateRequired(value: string) {
  return normalizeInput(value).length > 0
}

export function validateEmail(value: string) {
  const normalizedValue = normalizeInput(value)

  if (!normalizedValue) {
    return false
  }

  return EMAIL_REGEX.test(normalizedValue)
}

export function validatePhone(value: string) {
  const normalizedValue = normalizeInput(value)

  if (!normalizedValue) {
    return false
  }

  return PHONE_REGEX.test(normalizedValue)
}

export function validateMinLength(value: string, minLength: number) {
  return normalizeInput(value).length >= minLength
}

export function validateMaxLength(value: string, maxLength: number) {
  return normalizeInput(value).length <= maxLength
}

export function validateImageFile(file: File, maxSizeInMb = 5) {
  const maxBytes = maxSizeInMb * 1024 * 1024

  if (!file.type.startsWith("image/")) {
    return {
      valid: false,
      message: "Please select an image file",
    }
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      message: `File size must be less than ${maxSizeInMb}MB`,
    }
  }

  return {
    valid: true,
    message: "",
  }
}