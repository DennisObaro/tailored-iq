import type { User, ClientProfile, ExpertProfile, Role, SuggestedExpertise } from "@/lib/types";
import { simulateNetwork, simulateGeneration, ApiError } from "./client";
import { db } from "./_db";
import { suggestExpertise } from "@/lib/ai-sim/expertise-suggester";

export async function getUser(userId: string): Promise<User | null> {
  return simulateNetwork(() => db.get().users.find((u) => u.id === userId) ?? null, {
    latency: [80, 200],
  });
}

export async function updateUser(userId: string, patch: Partial<User>): Promise<User> {
  return simulateNetwork(() =>
    db.update((d) => {
      const user = d.users.find((u) => u.id === userId);
      if (!user) throw new ApiError("User not found.", "NOT_FOUND");
      Object.assign(user, patch, { updatedAt: new Date().toISOString() });
      return user;
    }),
  );
}

export async function switchActiveRole(userId: string, role: Role): Promise<User> {
  return updateUser(userId, { activeRole: role });
}

export async function addRole(userId: string, role: Role): Promise<User> {
  return simulateNetwork(() =>
    db.update((d) => {
      const user = d.users.find((u) => u.id === userId);
      if (!user) throw new ApiError("User not found.", "NOT_FOUND");
      if (!user.roles.includes(role)) user.roles.push(role);
      user.updatedAt = new Date().toISOString();
      return user;
    }),
  );
}

export async function completeOnboarding(userId: string): Promise<User> {
  return updateUser(userId, { onboardingComplete: true });
}

export async function getClientProfile(userId: string): Promise<ClientProfile | null> {
  return simulateNetwork(() => db.get().clientProfiles.find((p) => p.userId === userId) ?? null, {
    latency: [80, 200],
  });
}

export async function upsertClientProfile(profile: ClientProfile): Promise<ClientProfile> {
  return simulateNetwork(() =>
    db.update((d) => {
      const idx = d.clientProfiles.findIndex((p) => p.userId === profile.userId);
      if (idx >= 0) d.clientProfiles[idx] = profile;
      else d.clientProfiles.push(profile);
      return profile;
    }),
  );
}

export async function getExpertProfile(userId: string): Promise<ExpertProfile | null> {
  return simulateNetwork(() => db.get().expertProfiles.find((p) => p.userId === userId) ?? null, {
    latency: [80, 200],
  });
}

export async function analyzeExpertise(
  bio: string,
  currentRole: string,
  yearsExperience: number,
): Promise<SuggestedExpertise[]> {
  return simulateGeneration(() => suggestExpertise(bio, currentRole, yearsExperience), {
    latency: [700, 1200],
  });
}

export async function upsertExpertProfile(profile: ExpertProfile): Promise<ExpertProfile> {
  return simulateNetwork(() =>
    db.update((d) => {
      const idx = d.expertProfiles.findIndex((p) => p.userId === profile.userId);
      if (idx >= 0) d.expertProfiles[idx] = profile;
      else d.expertProfiles.push(profile);
      return profile;
    }),
  );
}
