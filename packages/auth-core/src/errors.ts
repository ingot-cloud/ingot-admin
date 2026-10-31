export const BFF_TRANSACTION_EXPIRED = "BFF_TRANSACTION_EXPIRED";
export const BFF_BINDING_MISMATCH = "BFF_BINDING_MISMATCH";
export const BFF_CSRF_INVALID = "BFF_CSRF_INVALID";
export const BFF_TRANSACTION_CONFLICT = "BFF_TRANSACTION_CONFLICT";
export const TRANSPORT_REPLAY_NONCE_DUP = "replay_nonce_dup";
export const BFF_TRANSACTION_BUSY = "BFF_TRANSACTION_BUSY";
export const errorCode = (error: unknown): string | undefined => {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string")
    return error.code;
  return undefined;
};
export const errorStatus = (error: unknown): number | undefined => {
  if (error && typeof error === "object" && "status" in error && typeof error.status === "number")
    return error.status;
  return undefined;
};
export const isBffTransactionExpired = (error: unknown): boolean =>
  errorCode(error) === BFF_TRANSACTION_EXPIRED;
export const isBffBindingMismatch = (error: unknown): boolean =>
  errorCode(error) === BFF_BINDING_MISMATCH;
export const isPreparationFailure = (error: unknown): boolean =>
  [BFF_TRANSACTION_EXPIRED, BFF_BINDING_MISMATCH, BFF_CSRF_INVALID].some(
    (code) => code === errorCode(error),
  );
/** 只对无法确定请求结果的网络/5xx或处理中状态查询结果，不自动重放密码。 */
export const isUncertainLogin = (error: unknown): boolean => {
  const status = errorStatus(error);
  if (
    error &&
    typeof error === "object" &&
    "kind" in error &&
    (error.kind === "network" || error.kind === "timeout")
  )
    return true;
  return (
    [BFF_TRANSACTION_BUSY, BFF_TRANSACTION_CONFLICT, TRANSPORT_REPLAY_NONCE_DUP].some(
      (code) => code === errorCode(error),
    ) ||
    (status !== undefined && status >= 500) ||
    (status === undefined &&
      ["NETWORK_ERROR", "TIMEOUT", "ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT"].some(
        (code) => code === errorCode(error),
      ))
  );
};

/** 查询有界结束后保留线索，供用户再次核对，不能重放密码。 */
export class LoginRecoveryPendingError extends Error {}
