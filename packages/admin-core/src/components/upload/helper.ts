import { isString, isArray } from "@/utils";

export function map(raw: any, key: string, targetKey: string) {
  const value = Reflect.get(raw, key);
  if (!value) {
    Reflect.set(raw, targetKey, []);
    return;
  }
  if (isString(value)) {
    Reflect.set(raw, targetKey, [{ url: value }]);
    return;
  }
  if (isArray(value)) {
    const tmp = value.map((item: string) => {
      return {
        url: item,
      };
    });
    Reflect.set(raw, targetKey, tmp);
  }
}

export function extract(raw: any, key: string, targetKey: string, isString?: boolean) {
  const value = Reflect.get(raw, key);
  if (!value) {
    return;
  }
  if (isString) {
    Reflect.set(raw, targetKey, value.length === 0 ? undefined : value[0].url);
  } else {
    Reflect.set(
      raw,
      targetKey,
      value.map((item: any) => item.url),
    );
  }
}
