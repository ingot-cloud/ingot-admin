/**
 * 平台预留的拦截器 order。
 *
 * 请求与响应都是数值越小越先执行：请求从小到大再到网络，
 * 响应从网络回来后同样从小到大再到调用方（不是越大越先）。
 *
 * http-client 占用 lifecycle / normalize；Header、Envelope、Challenge
 * 由适配器实现，数值在此预留以便 App 相对插队。
 */
export const InterceptorOrder = {
  request: {
    lifecycle: 1,
    header: 10,
    envelope: 25,
  },
  response: {
    lifecycle: 1,
    envelope: 5,
    normalize: 10,
    challenge: 15,
  },
} as const;
