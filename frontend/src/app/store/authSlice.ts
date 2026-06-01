import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'NURSE' | 'PATIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export const setCookie = (name: string, value: string, days = 7) => {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Strict`;
};

export const removeCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict`;
};

const getUserFromCookie = (): User | null => {
  const userStr = getCookie('user');
  if (!userStr) return null;
  try {
    return JSON.parse(decodeURIComponent(userStr));
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: getUserFromCookie(),
  token: getCookie('token'),
  refreshToken: getCookie('refresh_token'),
  isAuthenticated: !!getCookie('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      setCookie('user', encodeURIComponent(JSON.stringify(action.payload)), 1);
    },
    setTokens(state, action: PayloadAction<{ token: string; refreshToken: string }>) {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      setCookie('token', action.payload.token, 1);
      setCookie('refresh_token', action.payload.refreshToken, 7);
    },
    login(state, action: PayloadAction<{ user: User; token: string; refreshToken: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      setCookie('token', action.payload.token, 1);
      setCookie('refresh_token', action.payload.refreshToken, 7);
      setCookie('user', encodeURIComponent(JSON.stringify(action.payload.user)), 1);
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      removeCookie('token');
      removeCookie('refresh_token');
      removeCookie('user');
    },
  },
});

export const { setUser, setTokens, login, logout } = authSlice.actions;
export default authSlice.reducer;
