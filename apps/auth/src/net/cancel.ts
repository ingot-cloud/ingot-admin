import type { AxiosRequestConfig } from "axios";
import qs from "qs";

class CancelManager {
  private requestMap: Map<string, AbortController>;
  constructor() {
    this.requestMap = new Map<string, AbortController>();
  }

  /**
   * 添加请求
   */
  addRequest(config?: AxiosRequestConfig) {
    if (!config) {
      return;
    }
    if (config.signal) {
      return;
    }
    this.removeRequest(config);
    const abort = new AbortController();
    config.signal = abort.signal;
    this.requestMap.set(this.getUrl(config), abort);
  }

  /**
   * 移除请求
   */
  removeRequest(config?: AxiosRequestConfig) {
    if (!config) {
      return;
    }
    const url = this.getUrl(config);
    this.requestMap.delete(url);
  }

  /**
   * 中断所有请求
   */
  abort() {
    this.requestMap.forEach((abort) => {
      abort && abort.abort();
    });
    this.requestMap.clear();
  }

  getUrl(config: AxiosRequestConfig) {
    return [config.method, config.url, qs.stringify(config.data), qs.stringify(config.params)].join(
      "&",
    );
  }
}

export default new CancelManager();
