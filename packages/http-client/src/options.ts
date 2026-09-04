import type { AxiosRequestConfig } from "axios";
import type { RequestOptions } from "./types";

export const resolveFeedback = (config?: AxiosRequestConfig): "global" | "silent" => {
  return config?.feedback ?? "global";
};

export const resolveProgress = (config?: AxiosRequestConfig): "global" | "silent" => {
  return config?.progress ?? "global";
};

export const applyRequestOptions = (
  config: AxiosRequestConfig = {},
  options?: RequestOptions,
): AxiosRequestConfig => {
  if (!options) {
    return config;
  }
  if (options.signal) {
    config.signal = options.signal;
  }
  if (options.feedback) {
    config.feedback = options.feedback;
  }
  if (options.progress) {
    config.progress = options.progress;
  }
  return config;
};
