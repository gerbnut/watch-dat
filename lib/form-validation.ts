/** Returns an error string or null if valid. */

export function validateEmail(s: string): string | null {
  if (!s.trim()) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return 'Enter a valid email'
  return null
}

export function validateUsernameFormat(s: string): string | null {
  if (s.length < 3) return 'Username must be at least 3 characters'
  if (s.length > 20) return 'Username must be 20 characters or less'
  if (!/^[a-z0-9_]+$/.test(s)) return 'Letters, numbers, underscores only'
  return null
}

export function validateDisplayName(s: string): string | null {
  if (!s.trim()) return 'Display name is required'
  if (s.trim().length > 50) return 'Max 50 characters'
  return null
}

export function validatePassword(s: string): string | null {
  if (s.length < 8) return 'Password must be at least 8 characters'
  if (!/[a-zA-Z]/.test(s)) return 'Password must contain a letter'
  if (!/\d/.test(s)) return 'Password must contain a number'
  return null
}

export function validateBio(s: string): string | null {
  if (s.length > 300) return 'Bio must be 300 characters or less'
  return null
}

export function validateListName(s: string): string | null {
  if (!s.trim()) return 'Name is required'
  if (s.trim().length > 100) return 'Max 100 characters'
  return null
}

export function validateListDescription(s: string): string | null {
  if (s.length > 500) return 'Max 500 characters'
  return null
}
