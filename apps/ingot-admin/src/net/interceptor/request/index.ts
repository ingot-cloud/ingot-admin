import type { PreFilter } from "@/net/types";
import HeaderInterceptor from "./header";
import CryptoInterceptor from "./cypto";
import GlobalInterceptor from "./global";
import type { AxiosInstance } from "axios";

class RequestInterceptor {
  private interceptors: PreFilter[] = [];

  public constructor() {
    this.interceptors.push(GlobalInterceptor);
    this.interceptors.push(HeaderInterceptor);
    this.interceptors.push(CryptoInterceptor);
    // 倒序排列，因为axios拦截器，后配置的先执行
    this.interceptors.sort((a, b) => b.order() - a.order());
  }

  public install(axios: AxiosInstance) {
    this.interceptors.forEach((interceptor) => {
      axios.interceptors.request.use(
        interceptor.resolved,
        interceptor.rejected,
        interceptor.options,
      );
    });
  }
}

export default new RequestInterceptor();
