import { API_BASE_URL } from '@/lib/api'

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]']

const isLocal = (hostname: string) => LOCAL_HOSTS.includes(hostname)

/**
 * A production build that still points at localhost can never work for real visitors (their own computer has no
 * API). That happens when VITE_API_URL was not set on the host that built the site, so say so plainly instead of
 * showing a site where every request fails with a confusing "can't reach the server".
 */
export function apiConfigProblem(): string | null {
  if (!import.meta.env.PROD || isLocal(window.location.hostname)) return null
  try {
    if (isLocal(new URL(API_BASE_URL).hostname)) {
      return `This site was built to talk to ${API_BASE_URL}, which only works on the developer's own computer.`
    }
  } catch {
    return `VITE_API_URL ("${API_BASE_URL}") is not a valid address.`
  }
  return null
}
