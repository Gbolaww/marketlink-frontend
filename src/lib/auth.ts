export interface User {
  id: string
  email: string
  role: 'customer' | 'vendor' | 'admin'
  status: string
}

export const getUser = (): User | null => {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const setAuth = (accessToken: string, refreshToken: string, user: User): void => {
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('refresh_token', refreshToken)
  localStorage.setItem('user', JSON.stringify(user))
}

export const clearAuth = (): void => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

export const isLoggedIn = (): boolean => {
  return !!localStorage.getItem('access_token') && !!localStorage.getItem('user')
}