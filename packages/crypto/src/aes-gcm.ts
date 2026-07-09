import { base64Decode, base64Encode } from "./base64";
import { toArrayBufferView } from "./buffer";

const IV_LENGTH = 12;
const TAG_LENGTH = 128;

/**
 * 生成指定长度的随机字节
 */
export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

async function importAesKey(rawKey: Uint8Array, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", toArrayBufferView(rawKey), { name: "AES-GCM" }, false, usages);
}

/**
 * AES-256-GCM 加密，内部随机生成 12 字节 IV，输出 base64(IV(12) ‖ 密文 ‖ Tag(16))
 */
export async function encryptGcm(
  plainText: string,
  cek: Uint8Array,
  aad: Uint8Array,
): Promise<string> {
  const iv = randomBytes(IV_LENGTH);
  const key = await importAesKey(cek, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBufferView(iv), additionalData: toArrayBufferView(aad), tagLength: TAG_LENGTH },
    key,
    toArrayBufferView(new TextEncoder().encode(plainText)),
  );

  const cipherBytes = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.length);
  return base64Encode(combined);
}

/**
 * AES-256-GCM 解密，输入 base64(IV(12) ‖ 密文 ‖ Tag(16))
 */
export async function decryptGcm(
  cipherText: string,
  cek: Uint8Array,
  aad: Uint8Array,
): Promise<string> {
  const combined = base64Decode(cipherText);
  const iv = combined.slice(0, IV_LENGTH);
  const encrypted = combined.slice(IV_LENGTH);

  const key = await importAesKey(cek, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBufferView(iv), additionalData: toArrayBufferView(aad), tagLength: TAG_LENGTH },
    key,
    toArrayBufferView(encrypted),
  );
  return new TextDecoder().decode(decrypted);
}
