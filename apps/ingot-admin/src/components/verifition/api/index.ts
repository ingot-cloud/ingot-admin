/**
 * 此处可直接引用自己项目封装好的 axios 配合后端联调
 */

import request from "@/net";

//获取验证图片  以及token
export function reqGet(data: Object) {
  return request.get<Object>("/api/vc/image", data);
}

//滑动或者点选验证
export function reqCheck(data: Object) {
  return request.post("/api/vc/image/check", null, {
    params: data,
  });
}
