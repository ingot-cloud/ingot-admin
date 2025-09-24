// Base64 工具
function base64Encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}
function base64Decode(str: string) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

// =============== GCM 加密 =================
export async function encryptGCM(plainText: string, keyStr: string) {
  // 12字节IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyBytes = new TextEncoder().encode(keyStr);
  // 导入key（要求16/24/32字节）
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    new TextEncoder().encode(plainText),
  );

  // Base64( IV(12字节) + Ciphertext + Tag(16字节) )
  const cipherBytes = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.length);

  return base64Encode(combined);
}

// =============== GCM 解密 =================
export async function decryptGCM(cipherText: string, keyStr: string) {
  const data = base64Decode(cipherText);
  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);

  const keyBytes = new TextEncoder().encode(keyStr);
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "decrypt",
  ]);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    encrypted,
  );

  return new TextDecoder().decode(decrypted);
}
