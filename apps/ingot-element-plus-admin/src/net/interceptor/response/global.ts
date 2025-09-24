import type { AxiosResponse, AxiosError } from "axios";
import type { PostFilter } from "@/net/types";
import type { R } from "@/models/net";
import NProgress from "@/components/nprogress";
import CancelManager from "@/net/cancel";

class GlobalInterceptor implements PostFilter {
  order(): number {
    return 1;
  }

  resolved(response: AxiosResponse<R>): AxiosResponse<R> | Promise<AxiosResponse<R>> {
    NProgress.done();
    CancelManager.removeRequest(response.config);
    return response;
  }

  rejected(error: AxiosError): Promise<void> {
    NProgress.done();
    CancelManager.removeRequest(error.config);
    return Promise.reject(error);
  }
}

export default new GlobalInterceptor();
