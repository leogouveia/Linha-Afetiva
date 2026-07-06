"use client";
import { useRef, useState } from "react";

const AVATAR_SIZE = 320;

async function resizeToSquareDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d")!;
  const scale = Math.max(AVATAR_SIZE / bitmap.width, AVATAR_SIZE / bitmap.height);
  const sw = AVATAR_SIZE / scale;
  const sh = AVATAR_SIZE / scale;
  const sx = (bitmap.width - sw) / 2;
  const sy = (bitmap.height - sh) / 2;
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function AvatarInput({ name, initialDataUrl = null, ringColor }: { name: string; initialDataUrl?: string | null; ringColor?: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(initialDataUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setDataUrl(await resizeToSquareDataUrl(file));
  }

  return (
    <div className="flex items-center gap-4">
      <input type="hidden" name={name} value={dataUrl ?? ""} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        aria-label="Escolher foto"
        className="size-20 shrink-0 overflow-hidden rounded-full bg-violet-100 ring-2 ring-offset-2 ring-offset-white transition hover:opacity-90 dark:bg-violet-950 dark:ring-offset-[#1d1728]"
        style={{ boxShadow: `0 0 0 2px ${ringColor ?? "#c4b5fd"}` }}
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-violet-400 dark:text-violet-600" aria-hidden>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
            </svg>
          </span>
        )}
      </button>
      <div className="flex flex-col gap-1 text-sm">
        <button type="button" onClick={() => fileRef.current?.click()} className="text-left font-medium text-violet-700 hover:underline dark:text-violet-300">
          {dataUrl ? "Trocar foto" : "Escolher foto"}
        </button>
        {dataUrl && (
          <button type="button" onClick={() => setDataUrl(null)} className="text-left text-slate-500 hover:underline dark:text-slate-400">
            Remover foto
          </button>
        )}
      </div>
    </div>
  );
}
