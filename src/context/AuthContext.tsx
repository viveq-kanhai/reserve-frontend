// src/context/AuthContext.tsx
import { router } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
import { deleteToken, getToken, saveToken } from "../services/auth";

type User = {
  id: number;
  role: string;
  roles: string[];
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  register: (
    first_name: string,
    last_name: string,
    phone_number: string,
    password: string,
    password_confirmation: string,
  ) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: any) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    if (user.role === "admin") {
      router.replace("/(admin)/dashboard");
      return;
    }

    if (user.role === "merchant") {
      router.replace("/(merchant)/dashboard");
      return;
    }

    router.replace("/(user)/dashboard");
  }, [user, loading]);

  async function bootstrap() {
    const token = await getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/me"); // we will create this later
      setUser(res.data);
    } catch {
      await deleteToken();
    }

    setLoading(false);
  }

  async function register(
    first_name: string,
    last_name: string,
    phone_number: string,
    password: string,
    password_confirmation: string,
  ) {
    const res = await api.post("/register", {
      first_name,
      last_name,
      phone_number,
      password,
      password_confirmation,
    });

    await saveToken(res.data.token);
    setUser(res.data.user);
  }

  async function login(phone: string, password: string) {
    const res = await api.post("/login", {
      phone_number: phone,
      password,
    });

    await saveToken(res.data.token);
    setUser(res.data.user);
  }

  async function logout() {
    const token = await getToken();

    try {
      if (token) {
        await api.post("/logout");
      }
    } catch (e) {
      console.log("logout API failed (ignored)", e);
    }

    await deleteToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
