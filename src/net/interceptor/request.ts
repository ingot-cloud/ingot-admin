import { AxiosRequestConfig } from "axios";
import { getAccessToken } from "@/store/composition/auth";

export const onRequestFulfilled = (
  config: AxiosRequestConfig
): AxiosRequestConfig => {
  if (!config.headers["Authorization"]) {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
  }
  return config;
};

export const onRequestRejected = (error: unknown): Promise<void> => {
  return Promise.reject(error);
};
