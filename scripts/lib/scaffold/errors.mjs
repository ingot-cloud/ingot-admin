/**
 * 脚手架错误：HTTP 状态、稳定 code、可选字段级中文错误。
 */

export class ScaffoldError extends Error {
  /**
   * @param {string} message
   * @param {{
   *   code: string,
   *   status?: number,
   *   fields?: Record<string, string>,
   * }} options
   */
  constructor(message, { code, status = 400, fields } = {}) {
    super(message);
    this.name = "ScaffoldError";
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export const fail = (code, message, extra = {}) => {
  throw new ScaffoldError(message, { code, ...extra });
};

export const toErrorPayload = (error) => {
  if (error instanceof ScaffoldError) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    };
  }
  return {
    ok: false,
    error: {
      code: "WRITE_FAILED",
      message: "写入失败，请检查目标目录后重试",
    },
  };
};
