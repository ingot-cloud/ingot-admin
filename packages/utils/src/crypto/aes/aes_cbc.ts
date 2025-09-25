import CryptoJS from "crypto-js";

// =============== CBC 加密 =================
export function encryptCBC(plainText: string, keyStr: string) {
  const key = CryptoJS.enc.Utf8.parse(keyStr);
  const iv = CryptoJS.lib.WordArray.random(16); // 16字节IV

  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // 拼接 IV + Ciphertext，然后整体 Base64，保持和后端逻辑相同
  const combined = iv.clone().concat(encrypted.ciphertext);
  return CryptoJS.enc.Base64.stringify(combined);
}

// =============== CBC 解密 =================
export function decryptCBC(cipherText: string, keyStr: string) {
  const combined = CryptoJS.enc.Base64.parse(cipherText);
  const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4), 16); // 前16字节
  const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4), combined.sigBytes - 16);

  const key = CryptoJS.enc.Utf8.parse(keyStr);
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: ciphertext } as CryptoJS.lib.CipherParams,
    key,
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    },
  );

  return decrypted.toString(CryptoJS.enc.Utf8);
}
