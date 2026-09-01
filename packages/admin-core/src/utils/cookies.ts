import Cookies from "js-cookie";
import type { CookieParams } from "@/models/storage";
import { getAdminRuntimeConfig } from "@/runtime";

class InCookie {
  public set(cookie: CookieParams) {
    const { key, value, expires, path } = cookie;
    const storage = getAdminRuntimeConfig().storage;
    const finalKey = this.keyWrapper(key);
    const finalExpires = expires ? expires : storage.cookieExpireTime;
    Cookies.set(finalKey, value, {
      expires: finalExpires / 60 / 60 / 24, // 过期时间单位，秒转为天
      path: path || "/",
      domain: storage.cookieDomain,
    });
  }

  public get(key: string) {
    return Cookies.get(this.keyWrapper(key));
  }

  public remove(key: string, path = "/") {
    const finalKey = this.keyWrapper(key);
    Cookies.remove(finalKey, {
      path,
      domain: getAdminRuntimeConfig().storage.cookieDomain,
    });
  }

  public getAll() {
    return Cookies.get();
  }

  private keyWrapper(key: string) {
    return `${getAdminRuntimeConfig().storage.storePrefix}:${key}`;
  }
}

export const CookieManager = new InCookie();
