import type { AxiosResponse } from "axios";
import { defineResponseInterceptor, InterceptorOrder } from "@ingot/http-client";
import type { R } from "@/models/net";
import {
  createEnvelopeSession,
  applyEncryptedRequest,
  decryptResponseBody,
  CryptoErrorCode,
  type EnvelopeContext,
  type CryptoResponseOption,
} from "@ingot/shared/crypto";
import {
  keyStore,
  cryptoHeaderNames,
  rawInstance,
  maybeRefreshKeyOnKidMismatch,
  isEnvelopeResponse,
} from "@/net/crypto";

/**
 * 若响应为信封加密，按响应方向模式解密并回填 response.data
 */
async function decryptEnvelope(
  response: AxiosResponse<R>,
  option: CryptoResponseOption,
  context: EnvelopeContext,
): Promise<void> {
  if (!isEnvelopeResponse(response)) {
    return;
  }
  response.data = (await decryptResponseBody(response.data, option, context)) as R;
}

/**
 * 信封加密响应拦截器：在业务码展开之前解密（FULL 模式 code 也是密文，必须早于 normalize）。
 * 同时被动感知密钥轮换，并在 kid 失效时刷新公钥重试一次。
 */
export default defineResponseInterceptor({
  name: "envelope",
  order: InterceptorOrder.response.envelope,
  async resolved(response: AxiosResponse<R>): Promise<AxiosResponse<R>> {
    const config = response.config;
    const option = config.crypto;
    if (!option) {
      return response;
    }

    // 被动感知密钥轮换：响应 Kv 与本地 kid 不一致则异步刷新（须强制走网络，不能读 sessionStorage）
    maybeRefreshKeyOnKidMismatch(response);

    // kid 失效：刷新公钥、重新握手加密后重试一次
    const hasPlainRequest =
      option.request &&
      (config.__cryptoPlainParams !== undefined || config.__cryptoPlainData !== undefined);
    if (
      response.data?.code === CryptoErrorCode.KidUnknown &&
      !config.__cryptoRetried &&
      config.__cryptoCtx &&
      hasPlainRequest
    ) {
      config.__cryptoRetried = true;
      await keyStore.refresh();
      const session = await createEnvelopeSession(keyStore, cryptoHeaderNames);
      config.__cryptoCtx = session.context;
      config.headers = config.headers || {};
      for (const [key, value] of Object.entries(session.headers)) {
        config.headers[key] = value;
      }
      const applied = await applyEncryptedRequest(
        {
          data: config.__cryptoPlainData,
          params: config.__cryptoPlainParams,
        },
        option.request!,
        session.context,
      );
      if (applied.params !== undefined) {
        config.params = applied.params;
      }
      if (applied.data !== undefined) {
        config.data = applied.data;
      }

      const retryResponse = await rawInstance.request<R, AxiosResponse<R>>(config);
      if (option.response) {
        await decryptEnvelope(retryResponse, option.response, session.context);
      }
      return retryResponse;
    }

    if (option.response && config.__cryptoCtx) {
      await decryptEnvelope(response, option.response, config.__cryptoCtx);
    }
    return response;
  },
});
