import type { Role, User } from "@/lib/types";
import { simulateNetwork, ApiError } from "./client";
import { db, getSessionUserId, setSessionUserId } from "./_db";
import { id } from "@/lib/utils/id";
import { DEMO_CLIENT_ID, DEMO_EXPERT_ID, DEMO_DUAL_ID } from "@/lib/mock-data/fixtures/users.fixture";

export interface DemoPersona {
  id: string;
  label: string;
  sublabel: string;
}

const DEMO_PERSONAS: DemoPersona[] = [
  { id: DEMO_CLIENT_ID, label: "Demo client", sublabel: "Amara Chen" },
  { id: DEMO_EXPERT_ID, label: "Demo expert", sublabel: "Marcus Webb" },
  { id: DEMO_DUAL_ID, label: "Demo dual-role", sublabel: "Jordan Blake" },
];

export async function listDemoPersonas(): Promise<DemoPersona[]> {
  return simulateNetwork(DEMO_PERSONAS, { latency: [20, 60] });
}

export interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: Role[];
}

export async function signUp(input: SignUpInput): Promise<User> {
  return simulateNetwork(() => {
    const database = db.get();
    if (database.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new ApiError("An account with that email already exists.", "EMAIL_TAKEN");
    }
    const now = new Date().toISOString();
    const user: User = {
      id: id("user"),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      roles: input.roles,
      activeRole: input.roles[0] ?? "client",
      onboardingComplete: false,
      createdAt: now,
      updatedAt: now,
    };
    db.update((d) => d.users.push(user));
    setSessionUserId(user.id);
    return user;
  });
}

export interface SignInInput {
  email: string;
  password: string;
}

export async function signIn(input: SignInInput): Promise<User> {
  return simulateNetwork(() => {
    const database = db.get();
    const user = database.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (!user) {
      throw new ApiError("No account found with that email. Try creating one instead.", "NOT_FOUND");
    }
    setSessionUserId(user.id);
    return user;
  });
}

export async function signInAsDemoUser(userId: string): Promise<User> {
  return simulateNetwork(() => {
    const database = db.get();
    const user = database.users.find((u) => u.id === userId);
    if (!user) throw new ApiError("Demo user not found.", "NOT_FOUND");
    setSessionUserId(user.id);
    return user;
  }, { latency: [150, 300] });
}

export async function signOut(): Promise<void> {
  return simulateNetwork(() => {
    setSessionUserId(null);
  }, { latency: [100, 200] });
}

export async function getSession(): Promise<User | null> {
  return simulateNetwork(() => {
    const userId = getSessionUserId();
    if (!userId) return null;
    return db.get().users.find((u) => u.id === userId) ?? null;
  }, { latency: [50, 150] });
}
