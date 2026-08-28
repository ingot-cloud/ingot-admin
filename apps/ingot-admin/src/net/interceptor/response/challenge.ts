import type { AxiosResponse, AxiosError } from "axios";
import type { PostFilter } from "@/net/types";
import type { R } from "@/models/net";
import { Message } from "@/utils/message";
import { tryHandleGatewayChallenge } from "@/net/challenge";

class ChallengeInterceptor implements PostFilter {
  order(): number {
    return 15;
  }

  resolved(response: AxiosResponse<R>): AxiosResponse<R> {
    return response;
  }

  async rejected(error: AxiosError<R>): Promise<R> {
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
  }
}

export default new ChallengeInterceptor();
