import type { PreFilter } from "@/net/types";
import HeaderInterceptor from "./header";
import EnvelopeInterceptor from "./envelope";
import type { AxiosInstance } from "axios";

class RequestInterceptor {
  private interceptors: PreFilter[] = [];

  public constructor() {
    this.interceptors.push(HeaderInterceptor);
    this.interceptors.push(EnvelopeInterceptor);
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

  public list(): PreFilter[] {
    return this.interceptors;
  }
}

export default new RequestInterceptor();
