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
  const json = await res.json();
  // Unwrap standard { success: true, data: ... } envelope
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Public — all return the data field directly
  getProfile: () => fetchAPI<any>('/api/profile'),
  getProjects: () => fetchAPI<{ projects: any[]; pagination: any }>('/api/projects'),
  getExperience: () => fetchAPI<any[]>('/api/experience'),
  getSkills: () => fetchAPI<any[]>('/api/skills'),
  getTestimonials: () => fetchAPI<any[]>('/api/testimonials'),
  sendMessage: (data: object) =>
    fetchAPI<any>('/api/messages', { method: 'POST', body: JSON.stringify(data) }),

  // Admin auth
  login: (email: string, password: string) =>
    fetchAPI<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Generic admin fetch with auth token
  adminFetch: <T>(path: string, token: string, options?: RequestInit): Promise<T> =>
    fetchAPI<T>(path, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...options?.headers },
    }),
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
