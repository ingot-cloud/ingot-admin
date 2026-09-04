import type { AxiosRequestConfig } from "axios";
import qs from "qs";

export class CancelManager {
  private requestMap = new Map<string, AbortController>();

  addRequest(config?: AxiosRequestConfig): void {
    if (!config) {
      return;
    }
    if (config.signal || config.manualProcessingAbort) {
      return;
    }
    this.removeRequest(config);
    const abort = new AbortController();
    config.signal = abort.signal;
    this.requestMap.set(this.getUrl(config), abort);
  }

  removeRequest(config?: AxiosRequestConfig): void {
    if (!config) {
      return;
    }
    this.requestMap.delete(this.getUrl(config));
  }

  abort(): void {
    this.requestMap.forEach((controller) => {
      controller.abort();
    });
    this.requestMap.clear();
  }

  size(): number {
    return this.requestMap.size;
  }

  getUrl(config: AxiosRequestConfig): string {
    return [config.method, config.url, qs.stringify(config.data), qs.stringify(config.params)].join(
      "&",
    );
  }
}
