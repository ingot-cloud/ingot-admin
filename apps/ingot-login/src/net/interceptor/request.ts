import type { InternalAxiosRequestConfig, AxiosError } from "axios";

export const onRequestFulfilled = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
  return config;
};

export const onRequestRejected = (error: AxiosError): Promise<void> => {
  return Promise.reject(error);
};
