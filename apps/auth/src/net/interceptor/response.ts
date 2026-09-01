import type {
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { Message } from "@/utils/message";
import type { R } from "@/models";
import { StatusCode } from "@/net/status-code";
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

/**
 * 未知响应实体
 */
const UnknownResponse: R = {
  code: StatusCode.Unknown,
  message: "网络异常，请稍后重试",
  data: {},
  status: Number(StatusCode.Unknown),
  statusText: "网络异常，请稍后重试",
  headers: {},
  config: {} as InternalAxiosRequestConfig,
};

const axiosResponseToR = (response?: AxiosResponse<R>): R => {
  if (!response || !response.data) {
    return UnknownResponse;
  }
  const body = response.data as R & { msg?: string };
  const result = Object.assign({}, response, {
    data: body.data,
    message: body.message || body.msg || "",
    code: body.code,
  });
  return result;
};

/**
 * 业务失败公共处理器
 * @param config
 * @param response
 */
const bizResponseFailureHandler = (
  config: AxiosRequestConfig,
  response = UnknownResponse,
): Promise<R> => {
  // 如果手动处理，则直接返回
  if (config.manualProcessingFailure) {
    return Promise.reject(response);
  }

  const code = response.code;
  switch (code) {
    case StatusCode.TokenInvalid:
      if (config.refreshTokenAndRetry) {
        return Promise.reject(response);
      }
      return new Promise<R>(() => {});
    case StatusCode.TokenSignBack:
      break;
    default:
      Message.warning(response.message, { showClose: true });
      break;
  }
  return Promise.reject(response);
};

/**
 * 若响应为信封加密，按响应方向模式解密并回填 response.data
 */
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

/**
 * 信封加密响应处理：解密、被动感知密钥轮换、kid 失效重试一次。
 * 需在 axiosResponseToR 拍平前完成（FULL 模式 code 也是密文）。
 */
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

/**
 * 响应完成拦截器
 * @param response
 */
export const onResponseFulfilled = async (response: AxiosResponse<R>): Promise<R> => {
  const processed = await processEnvelope(response);
  const data = processed.data;
  if (data.code === StatusCode.OK) {
    return Promise.resolve(axiosResponseToR(processed));
  }
  return bizResponseFailureHandler(processed.config, axiosResponseToR(processed));
};

/**
 * 响应拒绝拦截器
 * @param error
 */
export const onResponseRejected = async (error: AxiosError<R>): Promise<R> => {
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
  return bizResponseFailureHandler(error.config || {}, axiosResponseToR(error.response));
};
