import type { User } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

interface AuthState {
  user: User | null;
  ready: boolean;
  syncError: string;
}

export const AuthContext = createContext<AuthState>({ user: null, ready: false, syncError: "" });

export function useAuth() { return useContext(AuthContext); }
