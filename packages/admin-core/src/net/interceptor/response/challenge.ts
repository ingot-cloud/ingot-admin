import type { AxiosError, AxiosResponse } from "axios";
import axios from "axios";
import { defineResponseInterceptor, InterceptorOrder, isApiError } from "@ingot/http-client";
import type { R } from "@/models/net";
import { Message } from "@/utils/message";
import { tryHandleGatewayChallenge } from "@/net/challenge";

export default defineResponseInterceptor({
  name: "challenge",
  order: InterceptorOrder.response.challenge,
  resolved(response: AxiosResponse<R>): AxiosResponse<R> {
    return response;
  },
  async rejected(error: AxiosError<R>): Promise<R> {
    if (!axios.isAxiosError(error) || isApiError(error)) {
      return Promise.reject(error);
    }
    try {
      const retried = await tryHandleGatewayChallenge(error);
      if (retried) {
        return retried;
      }
    } catch (challengeError) {
      if (challengeError instanceof Error) {
        Message.warning(challengeError.message, { showClose: true });
      }
      return Promise.reject(challengeError);
    }
    return Promise.reject(error);
  },
});
