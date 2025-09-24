import { isNull, getType, isArray, isBoolean, isNumber, isString, isObject } from "./index";

/**
 * 判断两个对象是否相等
 */
export function equals(o1: any, o2: any) {
  const o1IsNull = isNull(o1);
  const o2IsNull = isNull(o2);
  if (o1IsNull && o2IsNull) {
    return true;
  }

  if (o1IsNull || o2IsNull) {
    return false;
  }

  const o1Type = getType(o1);
  const o2Type = getType(o2);
  if (o1Type !== o2Type) {
    return false;
  }

  if (isBoolean(o1) || isNumber(o1) || isString(o1)) {
    return o1 === o2;
  }

  if (isArray(o1)) {
    return String(o1) === String(o2);
  }

  const keys = Object.keys(o1);
  const len = keys.length;
  for (let i = 0; i < len; i++) {
    const v1 = Reflect.get(o1, keys[i]);
    const v2 = Reflect.get(o2, keys[i]);
    if (!equals(v1, v2)) {
      return false;
    }
  }

  return true;
}

/**
 * 对比 raw 和 edit 对象，获取改后的对象
 * @param raw 原始对象
 * @param edit 编辑后的对象
 * @returns T
 */
export function getDiff<T extends object>(raw: T, edit: T): T {
  return getDiffWithIgnore(raw, edit);
}

/**
 * 对比 raw 和 edit 对象，获得更改后的对象
 * @param raw 原始对象
 * @param edit 编辑后的对象
 * @param ignore 忽略的key
 * @returns T
 */
export function getDiffWithIgnore<T extends object>(raw: T, edit: T, ignore?: Array<string>): T {
  const result = {};
  const keys = Object.entries(raw);
  keys.forEach(([k, v]) => {
    const editVal = Reflect.get(edit, k);
    if ((ignore && ignore.includes(k)) || !equals(editVal, v)) {
      Reflect.set(result, k, editVal);
    }
  });
  return result as T;
}

/**
 * 过滤参数, 空参数统一设置为null
 * @param params T
 */
export function filterParams<T extends object>(params: T): void {
  const keys = Object.keys(params);
  keys.forEach((key) => {
    const tmpVal = Reflect.get(params, key);
    if (typeof tmpVal !== "boolean" && typeof tmpVal !== "number" && !tmpVal) {
      Reflect.set(params, key, null);
    }
  });
}

/**
 * 是否含有条件参数
 */
export function hasConditionParams(condition?: object): boolean {
  if (!condition) {
    return false;
  }

  const values = Object.values(condition);
  if (values.length === 0) {
    return false;
  }

  let ret = false;
  values.forEach((v) => {
    ret = Boolean(v);
  });

  return ret;
}

/**
 * 拷贝参数
 */
export function copyParams<To extends object, From extends object>(
  to: To,
  from: From,
  filterNull?: boolean,
): void {
  const keys = Object.keys(from);
  copyParamsWithKeys(to, from, keys, filterNull);
}

/**
 * 拷贝参数，只拷贝指定key
 */
export function copyParamsWithKeys<To extends object, From extends object>(
  to: To,
  from: From,
  keys: Array<string>,
  filterNull?: boolean,
): void {
  let tmpValue;
  keys.forEach((key) => {
    tmpValue = Reflect.get(from, key);
    if (
      !filterNull ||
      typeof tmpValue === "boolean" ||
      (typeof tmpValue === "number" && tmpValue === 0) ||
      tmpValue
    ) {
      if (isArray(tmpValue)) {
        Reflect.set(to, key, (tmpValue as Array<any>).slice());
      } else if (isObject(tmpValue)) {
        Reflect.set(to, key, Object.assign({}, tmpValue));
      } else {
        Reflect.set(to, key, tmpValue);
      }
    }
  });
}

/**
 * 拷贝参数，并且忽略指定key
 */
export function copyParamsWithoutKeys<To extends object, From extends object>(
  to: To,
  from: From,
  ignoreKeys: Array<string>,
  filterNull?: boolean,
): void {
  const keys = Object.keys(from).filter((key) => {
    return !ignoreKeys.includes(key);
  });
  copyParamsWithKeys(to, from, keys, filterNull);
}

/**
 * 分配对象，并且忽略指定key
 * @param target
 * @param source
 * @param ignoreKeys
 */
export function assignIgnoreKeys<T extends {}, U>(target: T, source: U, ignoreKeys: Array<string>) {
  const middle = Object.assign({}, source);
  ignoreKeys.forEach((key) => {
    Reflect.deleteProperty(middle, key);
  });
  Object.assign(target, middle);
}
