import { decryptGcm, encryptGcm, randomBytes } from "./aes-gcm";
import { base64Encode } from "./base64";
import { wrapCek } from "./rsa-oaep";
import { encryptFields, decryptFields } from "./fields";
import type { KeyStore } from "./key-store";
import {
  CRYPTO_MD_V1,
  DEFAULT_HEADER_NAMES,
  DEFAULT_QUERY_PARAM_KEY,
  type CryptoHeaderNames,
  type CryptoRequestOption,
  type CryptoResponseOption,
  type EnvelopeContext,
} from "./types";

const CEK_LENGTH = 32;
const NONCE_LENGTH = 16;

/**
 * 构造 AAD："h1|<kid>|<nonce>|<ts>"
 */
export function buildAad(kid: string, nonce: string, ts: string): Uint8Array {
  const raw = `${CRYPTO_MD_V1}|${kid}|${nonce}|${ts}`;
  return new TextEncoder().encode(raw);
}

/**
 * 握手产出：协议头与用于解密响应的上下文
 */
export interface EnvelopeSession {
  headers: Record<string, string>;
  context: EnvelopeContext;
}

/**
 * 创建一次请求的信封握手：生成一次性 CEK、AAD，用公钥包裹 CEK，产出协议头。
 * 与"加密哪部分内容"无关，只要请求或响应任一方向需要加密都要先握手。
 */
export async function createEnvelopeSession(
  keyStore: KeyStore,
  headerNames: CryptoHeaderNames = DEFAULT_HEADER_NAMES,
): Promise<EnvelopeSession> {
  const activeKey = await keyStore.getActiveKey();
  const cek = randomBytes(CEK_LENGTH);
  const nonce = base64Encode(randomBytes(NONCE_LENGTH));
  const ts = String(Date.now());
  const aad = buildAad(activeKey.kid, nonce, ts);
  const wrappedCek = await wrapCek(cek, activeKey.publicKey);

  const headers: Record<string, string> = {
    [headerNames.md]: CRYPTO_MD_V1,
    [headerNames.kv]: activeKey.kid,
    [headerNames.sk]: wrappedCek,
    [headerNames.no]: nonce,
    [headerNames.ts]: ts,
  };

  return { headers, context: { cek, aad, kid: activeKey.kid, nonce, ts } };
}

/**
 * 按请求方向配置加密请求内容：
 * - whole：整段 JSON 加密为 { data: 密文 }
 * - query：整段 JSON 加密为 { [paramKey]: 密文 }，供 GET query 使用
 * - field：仅对清单字段各自加密，返回正常 JSON
 */
export async function encryptRequestContent(
  content: unknown,
  option: CryptoRequestOption,
  context: EnvelopeContext,
): Promise<unknown> {
  if (option.mode === "whole") {
    return { data: await encryptGcm(JSON.stringify(content), context.cek, context.aad) };
  }
  if (option.mode === "query") {
    const paramKey = option.paramKey ?? DEFAULT_QUERY_PARAM_KEY;
    const cipher = await encryptGcm(JSON.stringify(content), context.cek, context.aad);
    return { [paramKey]: cipher };
  }
  return encryptFields(content, context.cek, context.aad, option.fields ?? []);
}

/** @deprecated 使用 encryptRequestContent */
export const encryptRequestBody = encryptRequestContent;

function clonePayload<T>(payload: T): T {
  return JSON.parse(JSON.stringify(payload)) as T;
}

/**
 * 加密请求方向产出：query 写 params，whole/field 写 data，并返回明文备份供 kid 重试
 */
export interface ApplyEncryptedRequestResult {
  data?: unknown;
  params?: unknown;
  plainData?: unknown;
  plainParams?: unknown;
}

export async function applyEncryptedRequest(
  source: { data?: unknown; params?: unknown },
  option: CryptoRequestOption,
  context: EnvelopeContext,
): Promise<ApplyEncryptedRequestResult> {
  if (option.mode === "query") {
    const plainParams = clonePayload(source.params ?? {});
    const params = await encryptRequestContent(plainParams, option, context);
    return { params, plainParams };
  }
  if (source.data === undefined || source.data === null) {
    return {};
  }
  const plainData = clonePayload(source.data);
  const data = await encryptRequestContent(plainData, option, context);
  return { data, plainData };
}

/**
 * 按响应方向配置解密响应体：
 * - data_only：解密 body.data 并 JSON.parse 为业务数据
 * - full：整段密文解密后 JSON.parse 得完整 R
 * - field：仅对清单字段解密并按类型还原
 */
export async function decryptResponseBody(
  body: unknown,
  option: CryptoResponseOption,
  context: EnvelopeContext,
): Promise<unknown> {
  if (option.mode === "data_only") {
    if (body && typeof body === "object" && typeof (body as { data?: unknown }).data === "string") {
      const cipher = (body as { data: string }).data;
      const plain = await decryptGcm(cipher, context.cek, context.aad);
      return { ...(body as object), data: plain ? JSON.parse(plain) : plain };
    }
    return body;
  }
  if (option.mode === "full") {
    if (typeof body === "string") {
      const plain = await decryptGcm(body, context.cek, context.aad);
      return JSON.parse(plain);
    }
    return body;
  }
  return decryptFields(body, context.cek, context.aad, option.fields ?? []);
}
