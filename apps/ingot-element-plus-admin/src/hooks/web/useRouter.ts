import type { Router, RouteLocationRaw } from "vue-router";
import { PageName, PagePath, RedirectPageType, RedirectPageField } from "@/router";

export const useRedirect = (
  path = String(PagePath.ROOT),
  redirectType = String(RedirectPageType.PATH),
) => {
  const { currentRoute, replace } = useRouter();

  const { params, query } = unref(currentRoute);

  Reflect.deleteProperty(params, RedirectPageField.TYPE);
  Reflect.deleteProperty(params, RedirectPageField.PATH);

  return new Promise<void>((resolve, reject) => {
    const _path = Array.isArray(path) ? path.join("/") : path;
    switch (redirectType) {
      case RedirectPageType.NAME:
        replace({
          name: _path,
          query,
          params,
        });
        resolve();
        break;
      case RedirectPageType.PATH:
        replace({
          path: _path.startsWith("/") ? _path : "/" + _path,
          query,
        });
        resolve();
        break;
      default:
        reject();
        break;
    }
  });
};

export function useGo(router?: Router) {
  const { push, replace } = router || useRouter();
  return (opt: RouteLocationRaw, isReplace = false) => {
    if (!opt) {
      return;
    }
    isReplace ? replace(opt) : push(opt);
  };
}

export const useRefreshPage = (router?: Router) => {
  const { replace, currentRoute } = router || useRouter();
  const { query, params = {}, name, fullPath } = unref(currentRoute.value);
  return (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (name === PageName.REDIRECT) {
        resolve(false);
        return;
      }
      if (name && Object.keys(params).length > 0) {
        params[RedirectPageField.TYPE] = RedirectPageType.NAME;
        params[RedirectPageField.PATH] = String(name);
      } else {
        params[RedirectPageField.TYPE] = RedirectPageType.PATH;
        params[RedirectPageField.PATH] = fullPath;
      }
      replace({ name: PageName.REDIRECT, params, query }).then(() => resolve(true));
    });
  };
};
