"use client";

import {
  PROFILE_STORAGE_KEY,
  defaultProfile,
  parseProfile,
  serializeProfile,
  type Profile,
} from "@pravovukha/shared";
import { create } from "zustand";
import { getStorage } from "@/tma/cloudStorage";

type Status = "idle" | "loading" | "ready";

interface ProfileState {
  profile: Profile;
  status: Status;
  saveError: string | null;
  load: () => Promise<void>;
  update: (mutate: (current: Profile) => Profile) => Promise<void>;
}

// Записи идут строго по очереди, чтобы более старое значение не перезаписало новое.
let writeQueue: Promise<void> = Promise.resolve();

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: defaultProfile(),
  status: "idle",
  saveError: null,

  async load() {
    if (get().status !== "idle") return;
    set({ status: "loading" });
    try {
      const raw = await getStorage().get(PROFILE_STORAGE_KEY);
      set({ profile: parseProfile(raw), status: "ready" });
    } catch (error) {
      console.warn("Не удалось прочитать профиль, используем профиль по умолчанию", error);
      set({ profile: defaultProfile(), status: "ready" });
    }
  },

  async update(mutate) {
    const next = mutate(get().profile);
    set({ profile: next });
    const value = serializeProfile(next);
    writeQueue = writeQueue
      .then(() => getStorage().set(PROFILE_STORAGE_KEY, value))
      .then(() => set({ saveError: null }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.warn("Не удалось сохранить профиль", error);
        set({ saveError: message });
      });
    await writeQueue;
  },
}));
