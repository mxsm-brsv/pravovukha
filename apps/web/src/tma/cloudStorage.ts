import { CLOUD_KEY_RE, CLOUD_VALUE_LIMIT } from "@pravovukha/shared";
import { getWebApp, supports } from "./telegram";

/**
 * Прогресс хранится в Telegram CloudStorage пользователя: бесплатно и синхронно
 * между его устройствами. Вне Telegram (отладка в браузере) — в localStorage.
 */
export interface KeyValueStorage {
  readonly kind: "telegram" | "local" | "memory";
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

function assertKey(key: string): void {
  if (!CLOUD_KEY_RE.test(key)) {
    throw new Error(`Недопустимый ключ «${key}»: только A-Z, a-z, 0-9, _ и -, до 128 символов`);
  }
}

function assertValue(key: string, value: string): void {
  if (value.length > CLOUD_VALUE_LIMIT) {
    throw new Error(`Значение «${key}» длиннее ${CLOUD_VALUE_LIMIT} символов`);
  }
}

function telegramStorage(): KeyValueStorage {
  const storage = () => {
    const wa = getWebApp();
    if (!wa) throw new Error("Telegram WebApp недоступен");
    return wa.CloudStorage;
  };
  return {
    kind: "telegram",
    get(key) {
      assertKey(key);
      return new Promise((resolve, reject) => {
        storage().getItem(key, (error, value) => {
          if (error) reject(new Error(`CloudStorage.getItem: ${error}`));
          else resolve(value ? value : null);
        });
      });
    },
    set(key, value) {
      assertKey(key);
      assertValue(key, value);
      return new Promise((resolve, reject) => {
        storage().setItem(key, value, (error) => {
          if (error) reject(new Error(`CloudStorage.setItem: ${error}`));
          else resolve();
        });
      });
    },
    remove(key) {
      assertKey(key);
      return new Promise((resolve, reject) => {
        storage().removeItem(key, (error) => {
          if (error) reject(new Error(`CloudStorage.removeItem: ${error}`));
          else resolve();
        });
      });
    },
  };
}

const LOCAL_PREFIX = "pravovukha:";

function localStorageFallback(): KeyValueStorage {
  // В приватном режиме браузера localStorage может бросать исключения — тогда держим данные в памяти.
  const memory = new Map<string, string>();
  const local = (() => {
    try {
      const probe = `${LOCAL_PREFIX}probe`;
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return window.localStorage;
    } catch {
      return null;
    }
  })();

  return {
    kind: local ? "local" : "memory",
    async get(key) {
      assertKey(key);
      return local ? local.getItem(LOCAL_PREFIX + key) : (memory.get(key) ?? null);
    },
    async set(key, value) {
      assertKey(key);
      assertValue(key, value);
      if (local) local.setItem(LOCAL_PREFIX + key, value);
      else memory.set(key, value);
    },
    async remove(key) {
      assertKey(key);
      if (local) local.removeItem(LOCAL_PREFIX + key);
      else memory.delete(key);
    },
  };
}

let cached: KeyValueStorage | null = null;

export function getStorage(): KeyValueStorage {
  if (!cached) cached = supports("cloudStorage") ? telegramStorage() : localStorageFallback();
  return cached;
}
