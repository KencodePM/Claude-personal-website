const TOKEN_KEY = 'portfolio_user_token'

export function getUserToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setUserToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeUserToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

export function isUserAuthenticated(): boolean {
  return !!getUserToken()
}

/**
 * Unified fetch wrapper for authenticated user calls.
 *
 * - Always includes credentials so the httpOnly `portfolio_user_token`
 *   cookie (set by the backend at /api/auth/user/login) is sent.
 * - Also attaches `Authorization: Bearer <token>` from localStorage for
 *   backward compatibility with the pre-cookie clients; the backend
 *   accepts either and prefers the cookie when both are present.
 *
 * Only meant for JSON APIs. For multipart uploads, call fetch() directly
 * and set `credentials: 'include'` + `Authorization` yourself.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = getUserToken()
  const headers = new Headers(init.headers)
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers,
  })
}

/**
 * Log the user out on both client and server.
 * Calls POST /api/auth/user/logout so the httpOnly cookie is cleared,
 * then wipes the localStorage token. Swallows network errors — a failed
 * server call still results in a client-side logout.
 */
export async function logoutUser(): Promise<void> {
  try {
    await authFetch('/api/auth/user/logout', { method: 'POST' })
  } catch {
    // ignore — we still clear the client token
  }
  removeUserToken()
}
