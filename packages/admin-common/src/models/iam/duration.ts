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
