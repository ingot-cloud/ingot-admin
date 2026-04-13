import type { InternalAxiosRequestConfig, AxiosError } from "axios";
import { generateFingerprint } from "@ingot/utils";
import { useAppStore } from "@/stores/modules/app";
export const onRequestFulfilled = async (
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> => {
  const loginStore = useAppStore();
  if (loginStore.login.fingerprintEnabled) {
    const fingerprint = await generateFingerprint().catch(() => "");
    if (fingerprint) {
      config.headers["X-In-Ca-Sig"] = fingerprint;
    }
  }
  return Promise.resolve(config);
};

export const onRequestRejected = (error: AxiosError): Promise<void> => {
  return Promise.reject(error);
};
