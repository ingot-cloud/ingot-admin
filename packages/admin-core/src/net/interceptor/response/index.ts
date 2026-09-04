import type { PostFilter } from "@/net/types";
import EnvelopeInterceptor from "./envelope";
import ChallengeInterceptor from "./challenge";
import type { AxiosInstance } from "axios";

class ResponseInterceptor {
  private interceptors: PostFilter[] = [];

  public constructor() {
    this.interceptors.push(EnvelopeInterceptor);
    this.interceptors.push(ChallengeInterceptor);
    this.interceptors.sort((a, b) => a.order() - b.order());
  }

  public install(axios: AxiosInstance) {
    this.interceptors.forEach((interceptor) => {
      axios.interceptors.response.use(interceptor.resolved, interceptor.rejected);
    });
  }

  public list(): PostFilter[] {
    return this.interceptors;
  }
}

export default new ResponseInterceptor();
