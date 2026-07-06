const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

// Converts the data URL produced by AvatarInput's canvas resize into what the
// people table stores. null/undefined means "no photo" (clears it on update).
export function parseAvatarDataUrl(value: string | null | undefined): { avatar: Buffer | null; avatarType: string | null } {
  if (!value) return { avatar: null, avatarType: null };
  const match = DATA_URL_PATTERN.exec(value);
  if (!match) throw new Error("Formato de imagem inválido.");
  const avatar = Buffer.from(match[2], "base64");
  if (avatar.byteLength > MAX_AVATAR_BYTES) throw new Error("Imagem muito grande.");
  return { avatar, avatarType: match[1] };
}

export function toAvatarDataUrl(avatar: Buffer | null | undefined, avatarType: string | null | undefined): string | null {
  if (!avatar || !avatarType) return null;
  return `data:${avatarType};base64,${avatar.toString("base64")}`;
}
