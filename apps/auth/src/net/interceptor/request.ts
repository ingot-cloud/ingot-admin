import type { InternalAxiosRequestConfig, AxiosError } from "axios";
import { defineRequestInterceptor, InterceptorOrder } from "@ingot/http-client";
import { generateFingerprint } from "@ingot/shared";
import { createEnvelopeSession, applyEncryptedRequest } from "@ingot/shared/crypto";
import { useAppStore } from "@/stores/modules/app";
import { keyStore, cryptoHeaderNames } from "@/net/crypto";

export const onRequestFulfilled = async (
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> => {
  const loginStore = useAppStore();
  if (loginStore.login.fingerprintEnabled) {
    const fingerprint = await generateFingerprint().catch(() => "");
    if (fingerprint) {
      config.headers["In-Ca-Sig"] = fingerprint;
    }
  }

  const option = config.crypto;
  if (option && (option.request || option.response)) {
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
  }

  return config;
};

export const onRequestRejected = (error: AxiosError): Promise<void> => {
  return Promise.reject(error);
};

export default defineRequestInterceptor({
  name: "auth-request",
  order: InterceptorOrder.request.envelope,
  resolved: onRequestFulfilled,
  rejected: onRequestRejected,
});
