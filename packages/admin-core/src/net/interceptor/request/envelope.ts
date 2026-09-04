import type { InternalAxiosRequestConfig } from "axios";
import { defineRequestInterceptor, InterceptorOrder } from "@ingot/http-client";
import { createEnvelopeSession, applyEncryptedRequest } from "@ingot/shared/crypto";
import { keyStore, cryptoHeaderNames } from "@/net/crypto";

/**
 * 信封加密请求拦截器：按 config.crypto 握手、写协议头，并按请求方向模式加密。
 * query 模式加密 config.params（GET），whole/field 模式加密 config.data。
 */
export default defineRequestInterceptor({
  name: "envelope",
  order: InterceptorOrder.request.envelope,
  async resolved(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    const option = config.crypto;
    if (!option || (!option.request && !option.response)) {
      return config;
    }

    const session = await createEnvelopeSession(keyStore, cryptoHeaderNames);
    config.__cryptoCtx = session.context;
    config.headers = config.headers || {};
    for (const [key, value] of Object.entries(session.headers)) {
      config.headers[key] = value;
    }

    if (option.request) {
      const applied = await applyEncryptedRequest(
        { data: config.data, params: config.params },
        option.request,
        session.context,
      );
      if (applied.plainParams !== undefined) {
        config.__cryptoPlainParams = applied.plainParams;
        config.params = applied.params;
      }
      if (applied.plainData !== undefined) {
        config.__cryptoPlainData = applied.plainData;
        config.data = applied.data;
      }
    }

    return config;
  },
});
