const toString = Object.prototype.toString;

export const TYPE_FUNCTION = "Function";
export const TYPE_ASYNC_FUNCTION = "AsyncFunction";
export const TYPE_OBJECT = "Object";
export const TYPE_ARRAY = "Array";
export const TYPE_DATE = "Date";
export const TYPE_NUMBER = "Number";
export const TYPE_PROMISE = "Promise";
export const TYPE_STRING = "String";
export const TYPE_BOOLEAN = "Boolean";
export const TYPE_NULL = "Null";
export const TYPE_UNDEFINED = "Undefined";

/**
 * 是否为空
 */
export function isNull(val: unknown) {
  return val === null || val === undefined;
}

/**
 * 获取类型
 */
export function getType(val: unknown): string {
  return toString.call(val);
}

/**
 * 类型判断
 */
export function is(val: unknown, type: string) {
  return toString.call(val) === `[object ${type}]`;
}

/**
 * 是否为方法
 */
export function isFunction(val: unknown) {
  return is(val, TYPE_FUNCTION);
}

/**
 * 是否为对象
 */
export function isObject(val: unknown) {
  return is(val, TYPE_OBJECT);
}

/**
 * 是否为Array
 */
export function isArray(val: unknown) {
  return is(val, TYPE_ARRAY);
}

/**
 * 是否为string
 */
export function isString(val: unknown) {
  return is(val, TYPE_STRING);
}

/**
 * 是否为数字
 */
export function isNumber(val: unknown) {
  return is(val, TYPE_NUMBER);
}

/**
 * 是否为布尔
 */
export function isBoolean(val: unknown) {
  return is(val, TYPE_BOOLEAN);
}
