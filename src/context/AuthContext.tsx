import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { router } from 'expo-router';
import { api, setAuthToken, User } from '@/services/api';
import {
  getStoredToken,
  setStoredToken,
  getStoredUser,
  setStoredUser,
  getStoredRole,
  setStoredRole,
  clearStoredSession,
} from '@/utils/secureStore';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'CLINIC' | 'ADMIN';

export interface SignupResult {
  user?: User;
  token?: string;
  requiresVerification?: boolean;
  email?: string;
  role?: string;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, password: string, role?: UserRole) => Promise<User>;
  loginWithGoogle: (credential: string, role?: UserRole) => Promise<User>;
  signup: (formData: any) => Promise<SignupResult>;
  verifyOtp: (email: string, otp: string, role?: UserRole) => Promise<User>;
  resendOtp: (email: string, role?: UserRole) => Promise<{ success: boolean; message: string }>;
  logout: (resetRoute?: boolean) => Promise<void>;
  refreshUser: () => Promise<User | null>;
  updateUser: (updatedUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cold start rehydration from hardware-backed SecureStore
  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const storedToken = await getStoredToken();
      const cachedUser = await getStoredUser<User>();
      const cachedRole = await getStoredRole();

      if (storedToken) {
        setAuthToken(storedToken);
        setToken(storedToken);

        if (cachedUser) {
          setUser(cachedUser);
          setRoleState(cachedUser.role as UserRole);
        } else if (cachedRole) {
          setRoleState(cachedRole as UserRole);
        }

        try {
          // Revalidate token against live backend
          const liveUser = await api.getMe();
          if (liveUser) {
            setUser(liveUser);
            setRoleState(liveUser.role as UserRole);
            await setStoredUser(liveUser);
            await setStoredRole(liveUser.role);
            return liveUser;
          }
        } catch (fetchErr: any) {
          // Only invalidate session on strict 401 Unauthorized
          if (fetchErr?.status === 401 || fetchErr?.response?.status === 401) {
            console.warn('[AuthContext] Session expired or invalid (401), resetting credentials');
            await clearStoredSession();
            setAuthToken(null);
            setToken(null);
            setUser(null);
            setRoleState(null);
            return null;
          }
          // Preserve cached session on transient offline / 5xx gateway errors
          console.warn('[AuthContext] Backend unreachable during cold start, retaining cached profile');
          return cachedUser;
        }
      } else {
        setAuthToken(null);
        setToken(null);
        setUser(null);
        setRoleState(null);
      }
      return null;
    } catch (err) {
      console.error('[AuthContext] Failed to rehydrate session:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (
    emailOrPhone: string,
    password: string,
    requestedRole?: UserRole
  ): Promise<User> => {
    const payload: { email: string; password: string; role?: string } = {
      email: emailOrPhone.trim(),
      password,
      ...(requestedRole ? { role: requestedRole } : {}),
    };

    const res = await api.login(payload);

    if (res?.token && res?.user) {
      setAuthToken(res.token);
      await setStoredToken(res.token);
      await setStoredUser(res.user);
      await setStoredRole(res.user.role);

      setToken(res.token);
      setUser(res.user);
      setRoleState(res.user.role as UserRole);
      return res.user;
    }

    throw new Error('Authentication succeeded but server returned invalid user payload');
  };

  const loginWithGoogle = async (
    credential: string,
    targetRole: UserRole = 'PATIENT'
  ): Promise<User> => {
    const res = await api.googleAuth(credential, targetRole);

    if (res?.token && res?.user) {
      setAuthToken(res.token);
      await setStoredToken(res.token);
      await setStoredUser(res.user);
      await setStoredRole(res.user.role);

      setToken(res.token);
      setUser(res.user);
      setRoleState(res.user.role as UserRole);
      return res.user;
    }

    throw new Error('Google Sign-In succeeded but server returned invalid user payload');
  };

  const signup = async (formData: any): Promise<SignupResult> => {
    const res = await api.register(formData);

    if (res?.requiresVerification) {
      return {
        requiresVerification: true,
        email: res.email || formData.email,
        role: formData.role,
        message: res.message,
      };
    }

    if (res?.token && res?.user) {
      setAuthToken(res.token);
      await setStoredToken(res.token);
      await setStoredUser(res.user);
      await setStoredRole(res.user.role);

      setToken(res.token);
      setUser(res.user);
      setRoleState(res.user.role as UserRole);
      return { user: res.user, token: res.token };
    }

    return res;
  };

  const verifyOtp = async (
    email: string,
    otp: string,
    verificationRole?: UserRole
  ): Promise<User> => {
    const res = await api.verifyEmailOtp({
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
      ...(verificationRole ? { role: verificationRole } : {}),
    });

    if (res?.token && res?.user) {
      setAuthToken(res.token);
      await setStoredToken(res.token);
      await setStoredUser(res.user);
      await setStoredRole(res.user.role);

      setToken(res.token);
      setUser(res.user);
      setRoleState(res.user.role as UserRole);
      return res.user;
    }

    throw new Error('OTP verified but server returned invalid user payload');
  };

  const resendOtp = async (
    email: string,
    otpRole?: UserRole
  ): Promise<{ success: boolean; message: string }> => {
    return await api.resendEmailOtp(email.trim().toLowerCase(), otpRole);
  };

  const logout = async (resetRoute: boolean = true): Promise<void> => {
    setAuthToken(null);
    await clearStoredSession();
    setToken(null);
    setUser(null);
    setRoleState(null);
    if (resetRoute) {
      try {
        router.replace('/(auth)/login');
      } catch (navErr) {
        console.warn('[AuthContext] Navigation reset on logout warning:', navErr);
      }
    }
  };

  const updateUser = async (updatedUser: User): Promise<void> => {
    setUser(updatedUser);
    setRoleState(updatedUser.role as UserRole);
    await setStoredUser(updatedUser);
    await setStoredRole(updatedUser.role);
  };

  const value: AuthContextType = {
    user,
    token,
    role: role || (user?.role as UserRole) || null,
    isLoading,
    isAuthenticated: Boolean(token && user),
    login,
    loginWithGoogle,
    signup,
    verifyOtp,
    resendOtp,
    logout,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
