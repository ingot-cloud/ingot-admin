import type { AxiosResponse, AxiosError } from "axios";
import axios from "axios";
import type { PostFilter } from "@ingot/http-client";
import { isApiError } from "@ingot/http-client";
import { Message } from "@/utils/message";
import type { R } from "@/models";
import {
  createEnvelopeSession,
  applyEncryptedRequest,
  decryptResponseBody,
  CryptoErrorCode,
  type EnvelopeContext,
  type CryptoResponseOption,
} from "@ingot/shared/crypto";
import {
  keyStore,
  cryptoHeaderNames,
  rawInstance,
  maybeRefreshKeyOnKidMismatch,
  isEnvelopeResponse,
} from "@/net/crypto";
import { tryHandleGatewayChallenge } from "@/net/challenge";

const decryptEnvelope = async (
  response: AxiosResponse<R>,
  option: CryptoResponseOption,
  context: EnvelopeContext,
): Promise<void> => {
  if (!isEnvelopeResponse(response)) {
    return;
  }
  response.data = (await decryptResponseBody(response.data, option, context)) as R;
};

const processEnvelope = async (response: AxiosResponse<R>): Promise<AxiosResponse<R>> => {
  const config = response.config;
  const option = config.crypto;
  if (!option) {
    return response;
  }

  maybeRefreshKeyOnKidMismatch(response);

  const hasPlainRequest =
    option.request &&
    (config.__cryptoPlainParams !== undefined || config.__cryptoPlainData !== undefined);
  if (
    response.data?.code === CryptoErrorCode.KidUnknown &&
    !config.__cryptoRetried &&
    config.__cryptoCtx &&
    hasPlainRequest
  ) {
    config.__cryptoRetried = true;
    await keyStore.refresh();
    const session = await createEnvelopeSession(keyStore, cryptoHeaderNames);
    config.__cryptoCtx = session.context;
    config.headers = config.headers || {};
    for (const [key, value] of Object.entries(session.headers)) {
      config.headers[key] = value;
    }
    const applied = await applyEncryptedRequest(
      {
        data: config.__cryptoPlainData,
        params: config.__cryptoPlainParams,
      },
      option.request!,
      session.context,
    );
    if (applied.params !== undefined) {
      config.params = applied.params;
    }
    if (applied.data !== undefined) {
      config.data = applied.data;
    }

    const retryResponse = await rawInstance.request<R, AxiosResponse<R>>(config);
    if (option.response) {
      await decryptEnvelope(retryResponse, option.response, session.context);
    }
    return retryResponse;
  }

  if (option.response && config.__cryptoCtx) {
    await decryptEnvelope(response, option.response, config.__cryptoCtx);
  }
  return response;
};

export const EnvelopeInterceptor: PostFilter = {
  order: () => 5,
  resolved: processEnvelope,
  rejected: (error: AxiosError) => Promise.reject(error),
};

export const ChallengeInterceptor: PostFilter = {
  order: () => 15,
  resolved: (response: AxiosResponse<R>) => response,
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
};
