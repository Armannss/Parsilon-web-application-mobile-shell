"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type UserRole = "admin" | "user";

type SessionUser = {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
};

type LoginPayload = {
  phone: string;
  password: string;
};

type RegisterPayload = {
  fullName: string;
  phone: string;
  password: string;
};

type AuthActionResult = {
  success: boolean;
  message: string;
  user?: SessionUser | null;
};

type AuthContextType = {
  user: SessionUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<AuthActionResult>;
  register: (payload: RegisterPayload) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(role?: string): UserRole {
  return role === "ADMIN" || role === "admin" ? "admin" : "user";
}

function mapApiUser(raw: any): SessionUser | null {
  if (
    !raw ||
    typeof raw.id !== "string" ||
    typeof raw.fullName !== "string" ||
    typeof raw.phone !== "string"
  ) {
    return null;
  }

  return {
    id: raw.id,
    fullName: raw.fullName,
    phone: raw.phone,
    role: normalizeRole(raw.role),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshSession = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setUser(null);
        return;
      }

      setUser(mapApiUser(data.user));
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!isMounted) return;

        if (response.ok && data?.success) {
          setUser(mapApiUser(data.user));
        } else {
          setUser(null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async ({
    phone,
    password,
  }: LoginPayload): Promise<AuthActionResult> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          phone: phone.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        return {
          success: false,
          message: data?.message || "ورود انجام نشد.",
          user: null,
        };
      }

      const nextUser = mapApiUser(data.user);
      setUser(nextUser);

      return {
        success: true,
        message: "ورود با موفقیت انجام شد.",
        user: nextUser,
      };
    } catch {
      return {
        success: false,
        message: "خطا در ارتباط با سرور.",
        user: null,
      };
    }
  };

  const register = async ({
    fullName,
    phone,
    password,
  }: RegisterPayload): Promise<AuthActionResult> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        return {
          success: false,
          message: data?.message || "ثبت‌نام انجام نشد.",
          user: null,
        };
      }

      const nextUser = mapApiUser(data.user);
      setUser(nextUser);

      return {
        success: true,
        message: "ثبت‌نام با موفقیت انجام شد.",
        user: nextUser,
      };
    } catch {
      return {
        success: false,
        message: "خطا در ارتباط با سرور.",
        user: null,
      };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    setUser(null);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isReady,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}