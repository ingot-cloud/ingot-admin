import type { PostFilter } from "@/net/types";
import GlobalInterceptor from "./global";
import BizInterceptor from "./biz";
import EnvelopeInterceptor from "./envelope";
import ChallengeInterceptor from "./challenge";
import type { AxiosInstance } from "axios";

class ResponseInterceptor {
  private interceptors: PostFilter[] = [];

  public constructor() {
    this.interceptors.push(GlobalInterceptor);
    this.interceptors.push(EnvelopeInterceptor);
    this.interceptors.push(BizInterceptor);
    this.interceptors.push(ChallengeInterceptor);
    // 正序排列，因为axios响应拦截器，先配置的先执行
    this.interceptors.sort((a, b) => a.order() - b.order());
  }

  public install(axios: AxiosInstance) {
    this.interceptors.forEach((interceptor) => {
      axios.interceptors.response.use(interceptor.resolved, interceptor.rejected);
    });
  }
}

export default new ResponseInterceptor();
