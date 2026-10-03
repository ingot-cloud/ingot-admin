/** DatePicker 使用本地 Date，接口存储 UTC Instant，禁止把本地墙钟直接拼接 Z。 */
export const iamInstantDate = (value?: string): Date | undefined =>
  value ? new Date(value) : undefined;
export const iamDateInstant = (value?: Date | null): string | undefined =>
  value ? value.toISOString() : undefined;
export const durationHours = (value?: string): number => {
  const match =
    /^(?:P(?:(\d+(?:\.\d+)?)D)?)(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(
      value || "",
    );
  return match
    ? Number(match[1] || 0) * 24 +
        Number(match[2] || 0) +
        Number(match[3] || 0) / 60 +
        Number(match[4] || 0) / 3600
    : 0;
};
export const hoursDuration = (hours: number): string => `PT${Math.round(hours * 3600)}S`;

/** 将授权 Duration 转为可读中文时长，保持天、小时、分钟和秒的实际含义。 */
export const formatDuration = (value?: string): string => {
  let remaining = Number((durationHours(value) * 3600).toFixed(9));
  if (!Number.isFinite(remaining) || remaining <= 0) return "未设置";
  const units = [
    { seconds: 86400, label: "天" },
    { seconds: 3600, label: "小时" },
    { seconds: 60, label: "分钟" },
    { seconds: 1, label: "秒" },
  ];
  const parts: string[] = [];
  for (const unit of units) {
    const count = unit.seconds === 1 ? remaining : Math.floor(remaining / unit.seconds);
    if (count > 0) parts.push(`${count} ${unit.label}`);
    remaining = Number((remaining - count * unit.seconds).toFixed(9));
  }
  return parts.join(" ");
};
