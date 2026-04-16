/**
 * Tests for frontend/lib/userAuth.ts
 *
 * Covers:
 *  - getUserToken: returns stored value or null
 *  - setUserToken: writes to localStorage
 *  - removeUserToken: removes from localStorage
 *  - isUserAuthenticated: returns true when token present, false otherwise
 *
 * localStorage is stubbed via a manual mock (same pattern as api.test.ts).
 */

const TOKEN_KEY = 'portfolio_user_token';

// Minimal localStorage stub
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: jest.fn((key: string) => localStorageStore[key] ?? null),
  setItem: jest.fn((key: string, value: string) => { localStorageStore[key] = value; }),
  removeItem: jest.fn((key: string) => { delete localStorageStore[key]; }),
  clear: jest.fn(() => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }),
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

// Ensure `window` is defined so the SSR guard (`typeof window === 'undefined'`) doesn't fire
if (typeof window === 'undefined') {
  (global as any).window = global;
}

import { getUserToken, setUserToken, removeUserToken, isUserAuthenticated } from '../lib/userAuth';

describe('userAuth token helpers', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('setUserToken', () => {
    it('stores the token under the correct key', () => {
      setUserToken('jwt-abc-123');
      expect(localStorage.setItem).toHaveBeenCalledWith(TOKEN_KEY, 'jwt-abc-123');
      expect(localStorageStore[TOKEN_KEY]).toBe('jwt-abc-123');
    });
  });

  describe('getUserToken', () => {
    it('returns the stored token when one exists', () => {
      localStorageStore[TOKEN_KEY] = 'jwt-stored';
      const token = getUserToken();
      expect(token).toBe('jwt-stored');
    });

    it('returns null when no token is stored', () => {
      const token = getUserToken();
      expect(token).toBeNull();
    });
  });

  describe('removeUserToken', () => {
    it('removes the token from localStorage', () => {
      localStorageStore[TOKEN_KEY] = 'to-be-removed';
      removeUserToken();
      expect(localStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
      expect(localStorageStore[TOKEN_KEY]).toBeUndefined();
    });
  });

  describe('isUserAuthenticated', () => {
    it('returns true when a token is present', () => {
      localStorageStore[TOKEN_KEY] = 'valid-token';
      expect(isUserAuthenticated()).toBe(true);
    });

    it('returns false when no token is stored', () => {
      expect(isUserAuthenticated()).toBe(false);
    });

    it('returns false after token is removed', () => {
      localStorageStore[TOKEN_KEY] = 'token';
      removeUserToken();
      expect(isUserAuthenticated()).toBe(false);
    });
  });
});
