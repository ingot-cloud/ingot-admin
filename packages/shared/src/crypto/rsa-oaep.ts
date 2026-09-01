import { base64Decode, base64Encode } from "./base64";
import { toArrayBufferView } from "./buffer";
import { getSubtleCrypto } from "./provider";

/**
 * 导入 X509(SPKI) Base64 公钥，用于 RSA-OAEP-256 包裹 CEK
 */
export async function importRsaPublicKey(x509Base64: string): Promise<CryptoKey> {
  const spki = toArrayBufferView(base64Decode(x509Base64));
  const subtle = await getSubtleCrypto();
  return subtle.importKey("spki", spki, { name: "RSA-OAEP", hash: "SHA-256" }, false, [
    "encrypt",
  ]);
}

/**
 * 用公钥 RSA-OAEP-256 包裹 CEK，输出 base64
 */
export async function wrapCek(cek: Uint8Array, publicKey: CryptoKey): Promise<string> {
  const subtle = await getSubtleCrypto();
  const wrapped = await subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    toArrayBufferView(cek),
  );
  return base64Encode(new Uint8Array(wrapped));
}
