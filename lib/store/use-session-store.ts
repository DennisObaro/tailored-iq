import { create } from "zustand";
import type { User, ClientProfile, ExpertProfile, Role } from "@/lib/types";
import * as authApi from "@/lib/api/auth";
import * as usersApi from "@/lib/api/users";

interface SessionState {
  status: "idle" | "loading" | "ready";
  user: User | null;
  clientProfile: ClientProfile | null;
  expertProfile: ExpertProfile | null;
  error: string | null;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (input: { firstName: string; lastName: string; email: string; password: string; roles: Role[] }) => Promise<User>;
  signInAsDemo: (userId: string) => Promise<User>;
  signOut: () => Promise<void>;
  switchRole: (role: Role) => Promise<void>;
  refresh: () => Promise<void>;
}

async function loadProfiles(user: User) {
  const [clientProfile, expertProfile] = await Promise.all([
    user.roles.includes("client") ? usersApi.getClientProfile(user.id) : Promise.resolve(null),
    user.roles.includes("expert") ? usersApi.getExpertProfile(user.id) : Promise.resolve(null),
  ]);
  return { clientProfile, expertProfile };
}

export const useSessionStore = create<SessionState>((set, get) => ({
  status: "idle",
  user: null,
  clientProfile: null,
  expertProfile: null,
  error: null,

  init: async () => {
    if (get().status !== "idle") return;
    set({ status: "loading" });
    const user = await authApi.getSession();
    if (!user) {
      set({ status: "ready", user: null, clientProfile: null, expertProfile: null });
      return;
    }
    const { clientProfile, expertProfile } = await loadProfiles(user);
    set({ status: "ready", user, clientProfile, expertProfile });
  },

  signIn: async (email, password) => {
    set({ error: null });
    try {
      const user = await authApi.signIn({ email, password });
      const { clientProfile, expertProfile } = await loadProfiles(user);
      set({ user, clientProfile, expertProfile, status: "ready" });
      return user;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Something went wrong." });
      throw e;
    }
  },

  signUp: async (input) => {
    set({ error: null });
    try {
      const user = await authApi.signUp(input);
      set({ user, clientProfile: null, expertProfile: null, status: "ready" });
      return user;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Something went wrong." });
      throw e;
    }
  },

  signInAsDemo: async (userId) => {
    const user = await authApi.signInAsDemoUser(userId);
    const { clientProfile, expertProfile } = await loadProfiles(user);
    set({ user, clientProfile, expertProfile, status: "ready" });
    return user;
  },

  signOut: async () => {
    await authApi.signOut();
    set({ user: null, clientProfile: null, expertProfile: null });
  },

  switchRole: async (role) => {
    const current = get().user;
    if (!current) return;
    const user = await usersApi.switchActiveRole(current.id, role);
    set({ user });
  },

  refresh: async () => {
    const current = get().user;
    if (!current) return;
    const user = await usersApi.getUser(current.id);
    if (!user) return;
    const { clientProfile, expertProfile } = await loadProfiles(user);
    set({ user, clientProfile, expertProfile });
  },
}));
