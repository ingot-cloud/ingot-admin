export const isVisibleUtilityBadge = (badge: string | number | undefined): boolean => {
  if (typeof badge === "number") {
    return badge !== 0;
  }
  if (badge === undefined) {
    return false;
  }
  const text = badge.trim();
  return text !== "" && text !== "0";
};
