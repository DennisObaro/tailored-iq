import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export function id(prefix?: string) {
  return prefix ? `${prefix}_${nanoid()}` : nanoid();
}
