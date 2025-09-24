import Cookies from "js-cookie";
import type { CookieParams } from "@/models/storage";

class InCookie {
  public set(cookie: CookieParams) {
    const { key, value, expires, path } = cookie;
    const finalKey = this.keyWrapper(key);
    const finalExpires = expires ? expires : import.meta.env.VITE_APP_COOKIE_DEFAULT_EXPIRE_TIME;
    Cookies.set(finalKey, value, {
      expires: finalExpires / 60 / 60 / 24, // 过期时间单位，秒转为天
      path: path || "/",
      domain: import.meta.env.VITE_APP_COOKIE_DOMAIN,
    });
  }

  public get(key: string) {
    return Cookies.get(this.keyWrapper(key));
  }

  public remove(key: string, path = "/") {
    const finalKey = this.keyWrapper(key);
    Cookies.remove(finalKey, {
      path,
      domain: import.meta.env.VITE_APP_COOKIE_DOMAIN,
    });
  }

  public getAll() {
    return Cookies.get();
  }

  private keyWrapper(key: string) {
    return `${import.meta.env.VITE_APP_STORE_PREFIX}:${key}`;
  }
}

export const CookieManager = new InCookie();
