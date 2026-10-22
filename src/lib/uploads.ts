import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 8 * 1024 * 1024;

export function sniffImage(buffer: Buffer) {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.length > 8 && buffer[0] === 0x89 && buffer.toString("ascii", 1, 4) === "PNG") return "png";
  if (buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  return null;
}

export async function saveImage(file: File) {
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error("Fotografija mora biti manjša od 8 MB.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = sniffImage(buffer);
  if (!ext) throw new Error("Dovoljene so samo fotografije JPG, PNG ali WEBP.");
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return `/uploads/${name}`;
}

export async function removeUpload(url: string) {
  if (!url.startsWith("/uploads/") || url.includes("..")) return;
  const dir = path.resolve(process.cwd(), "public", "uploads");
  const target = path.resolve(process.cwd(), "public", url.replace(/^\//, ""));
  const relative = path.relative(dir, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return;
  await unlink(target).catch(() => undefined);
}
