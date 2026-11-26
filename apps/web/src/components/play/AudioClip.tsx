"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { assetUrl } from "@/data/assets";
import type { PuzzleAudio } from "@/data/types";
import { haptic } from "@/tma/haptics";
import { Icon } from "../ui/Icon";

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let sharedContext: AudioContext | null = null;
function audioContext(): AudioContext {
  if (!sharedContext) {
    const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    sharedContext = new Ctor();
  }
  return sharedContext;
}

const decoded = new Map<string, Promise<AudioBuffer>>();

function loadBuffer(src: string, reverse: boolean): Promise<AudioBuffer> {
  const key = `${src}|${reverse}`;
  let promise = decoded.get(key);
  if (!promise) {
    promise = fetch(assetUrl(src))
      .then((r) => {
        if (!r.ok) throw new Error(`Нет файла ${src}`);
        return r.arrayBuffer();
      })
      .then((data) => audioContext().decodeAudioData(data))
      .then((buffer) => {
        if (!reverse) return buffer;
        const ctx = audioContext();
        const copy = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
        for (let c = 0; c < buffer.numberOfChannels; c++) {
          const data = new Float32Array(buffer.getChannelData(c));
          data.reverse();
          copy.copyToChannel(data, c);
        }
        return copy;
      });
    decoded.set(key, promise);
  }
  return promise;
}

/**
 * Проигрыватель отрывка для головоломок. Файл задом наперёд разворачивается прямо
 * в браузере, поэтому в папку audio достаточно положить обычную запись.
 */
export function AudioClip({ audio }: { audio: PuzzleAudio }) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const source = useRef<AudioBufferSourceNode | null>(null);
  const frame = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    try {
      source.current?.stop();
    } catch {
      // уже остановлен
    }
    source.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const play = async () => {
    if (state === "playing") {
      stop();
      setState("idle");
      setProgress(0);
      return;
    }
    haptic.tap();
    setState("loading");
    try {
      const ctx = audioContext();
      if (ctx.state === "suspended") await ctx.resume();
      const buffer = await loadBuffer(audio.src, Boolean(audio.reverse));
      const total = buffer.duration;
      // Для перевёрнутой записи отрезок тоже переворачиваем, чтобы звучал тот же фрагмент.
      let from = audio.start ?? 0;
      let to = audio.end ?? total;
      if (audio.reverse) [from, to] = [total - to, total - from];
      const length = Math.max(0.1, to - from);
      const node = ctx.createBufferSource();
      node.buffer = buffer;
      node.connect(ctx.destination);
      const startedAt = ctx.currentTime;
      node.start(0, from, length);
      node.onended = () => {
        if (source.current === node) {
          stop();
          setState("idle");
          setProgress(0);
        }
      };
      source.current = node;
      setState("playing");
      const tick = () => {
        setProgress(Math.min(1, (ctx.currentTime - startedAt) / length));
        frame.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (error) {
      console.warn(error);
      setState("error");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-section p-3">
      <button
        type="button"
        onClick={play}
        aria-label={state === "playing" ? "Остановить" : "Слушать"}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-button text-button-fg"
      >
        <Icon name={state === "playing" ? "stop" : "play"} size={22} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-fg">
          {state === "loading" ? "Загружаем…" : state === "error" ? "Не удалось воспроизвести" : audio.reverse ? "Отрывок задом наперёд" : "Отрывок"}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hint/25">
          <div className="h-full rounded-full bg-button" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      {audio.reverse && <Icon name="rewind" size={20} className="shrink-0 text-hint" />}
    </div>
  );
}
