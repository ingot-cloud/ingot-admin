/** 时间点收发 ISO，展示默认浏览器时区；日期、日内时间及 Duration 不使用这些函数。 */
export const DEFAULT_DISPLAY_TIME_ZONE = "Asia/Shanghai";

const ISO_INSTANT =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-](\d{2}):(\d{2}))$/;

/** 严格解析带偏移量的时间点供 DatePicker 使用，非法值返回 undefined。 */
export function parseInstantDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const match = ISO_INSTANT.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const offsetHours = Number(match[8] ?? 0);
  const offsetMinutes = Number(match[9] ?? 0);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > (days[month - 1] ?? 0) ||
    Number(match[4]) > 23 ||
    Number(match[5]) > 59 ||
    Number(match[6]) > 59 ||
    offsetHours > 18 ||
    offsetMinutes > 59 ||
    (offsetHours === 18 && offsetMinutes !== 0)
  )
    return undefined;
  // Date 的精度为毫秒；只转换选择器视图，原始 ISO 模型保留完整精度。
  const dateValue = value.replace(
    /\.(\d{1,9})(?=Z|[+-])/,
    (_, fraction: string) => `.${fraction.padEnd(3, "0").slice(0, 3)}`,
  );
  const date = new Date(dateValue);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

/** 将本地 DatePicker 的选择转换为 UTC ISO；空选择省略，非法 Date 抛出 RangeError。 */
export function toApiInstant(value?: Date | null): string | undefined {
  return value ? value.toISOString() : undefined;
}

/** 返回浏览器时区，无法识别时回退上海。 */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_DISPLAY_TIME_ZONE;
  } catch {
    return DEFAULT_DISPLAY_TIME_ZONE;
  }
}

export interface TimeDisplayOptions {
  /** 显式指定展示时区，缺省浏览器时区。 */
  timeZone?: string;
  /** 空值或非法输入的展示，缺省 "-"。 */
  fallback?: string;
}

/** 格式化时间点为 yyyy-MM-dd HH:mm:ss；不修改原始 ISO 字符串或其小数秒精度。 */
export function formatDateTime(value: unknown, options: TimeDisplayOptions = {}): string {
  const date =
    value instanceof Date ? value : typeof value === "string" ? parseInstantDate(value) : undefined;
  if (!date || !Number.isFinite(date.getTime())) return options.fallback ?? "-";
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: options.timeZone ?? browserTimeZone(),
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = new Map(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.get("year")?.padStart(4, "0")}-${parts.get("month")}-${parts.get("day")} ${parts.get("hour")}:${parts.get("minute")}:${parts.get("second")}`;
}
