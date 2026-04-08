// Use relative URL so requests go through Next.js rewrites (avoids CORS).
// The rewrite rule in next.config.ts proxies /api/* to the actual backend.
const API_URL = '';

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Public
  getProfile: () => fetchAPI<any>('/api/profile'),
  getProjects: () => fetchAPI<any[]>('/api/projects'),
  getExperience: () => fetchAPI<any[]>('/api/experience'),
  getSkills: () => fetchAPI<any[]>('/api/skills'),
  getTestimonials: () => fetchAPI<any[]>('/api/testimonials'),
  sendMessage: (data: object) => fetchAPI<any>('/api/messages', { method: 'POST', body: JSON.stringify(data) }),

  // Admin - with auth token
  login: (email: string, password: string) =>
    fetchAPI<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Admin CRUD (token passed via headers)
  adminFetch: <T>(path: string, token: string, options?: RequestInit): Promise<T> =>
    fetchAPI<T>(path, { ...options, headers: { Authorization: `Bearer ${token}`, ...options?.headers } }),
};

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export function setToken(token: string) {
  localStorage.setItem('admin_token', token);
}

export function removeToken() {
  localStorage.removeItem('admin_token');
}
