/**
 * Tests for frontend/lib/api.ts
 *
 * Covers fetchAPI behaviour:
 *  1. Unwraps { success: true, data: X } → returns X
 *  2. Returns the raw JSON when there is no `data` key
 *  3. Throws on non-ok HTTP response
 *
 * Also tests getToken / setToken / removeToken (admin token helpers).
 *
 * `fetch` is replaced with a jest.fn() so no real network calls happen.
 * `localStorage` is simulated via jest-environment-jsdom or a manual mock.
 */

// Provide a minimal localStorage stub for the Node/jsdom environment
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: jest.fn((key: string) => localStorageStore[key] ?? null),
  setItem: jest.fn((key: string, value: string) => { localStorageStore[key] = value; }),
  removeItem: jest.fn((key: string) => { delete localStorageStore[key]; }),
  clear: jest.fn(() => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }),
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

// Ensure `window` is defined so SSR guards in lib/api.ts don't short-circuit
if (typeof window === 'undefined') {
  (global as any).window = global;
}

// Provide a global fetch mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to build a mock Response-like object
function mockResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  };
}

// We need to re-import after setting globals — use require inside each describe
// so the module picks up the mocked fetch/localStorage.

describe('fetchAPI — envelope unwrapping', () => {
  // We access fetchAPI indirectly through the `api` export which calls fetchAPI internally.
  // But since fetchAPI is NOT exported, we test it through api.getProfile / api.login etc.
  // For the unwrapping behaviour we call api.getProfile which calls fetchAPI('/api/profile').

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('unwraps { success: true, data: X } and returns X', async () => {
    const profileData = { id: 'p1', nameEn: 'John' };
    mockFetch.mockResolvedValue(mockResponse({ success: true, data: profileData }));

    const { api } = await import('../lib/api');
    const result = await api.getProfile();

    expect(result).toEqual(profileData);
  });

  it('returns raw JSON when there is no `data` key', async () => {
    // A response without a data key — should be returned as-is
    const rawBody = { foo: 'bar', baz: 42 };
    mockFetch.mockResolvedValue(mockResponse(rawBody));

    // Use a low-level path — sendMessage returns whatever fetchAPI resolves to
    // We'll monkey-patch by calling the login endpoint with a specially crafted mock
    mockFetch.mockResolvedValueOnce(mockResponse(rawBody));
    const { api } = await import('../lib/api');
    // login uses fetchAPI and returns data (if present) or raw
    const result = await api.login('a@b.com', 'pass');
    // rawBody has no `data` key so we get rawBody itself
    expect(result).toEqual(rawBody);
  });

  it('throws an Error on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse({ error: 'Unauthorized' }, false, 401));

    const { api } = await import('../lib/api');
    await expect(api.getProfile()).rejects.toThrow('Unauthorized');
  });

  it('throws generic "Request failed" when error body cannot be parsed', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error('bad json')),
    });

    const { api } = await import('../lib/api');
    await expect(api.getProfile()).rejects.toThrow('Request failed');
  });
});

describe('getToken / setToken / removeToken', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('setToken stores the token in localStorage', async () => {
    const { setToken } = await import('../lib/api');
    setToken('my-admin-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('admin_token', 'my-admin-token');
  });

  it('getToken returns the stored token', async () => {
    localStorageStore['admin_token'] = 'stored-token';
    const { getToken } = await import('../lib/api');
    expect(getToken()).toBe('stored-token');
  });

  it('getToken returns null when nothing is stored', async () => {
    const { getToken } = await import('../lib/api');
    expect(getToken()).toBeNull();
  });

  it('removeToken clears the token from localStorage', async () => {
    localStorageStore['admin_token'] = 'will-be-removed';
    const { removeToken } = await import('../lib/api');
    removeToken();
    expect(localStorage.removeItem).toHaveBeenCalledWith('admin_token');
    expect(localStorage.getItem('admin_token')).toBeNull();
  });
});
