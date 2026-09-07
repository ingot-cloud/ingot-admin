export const DESCRIPTION_EMPTY = "-";

export const formatDescriptionValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return DESCRIPTION_EMPTY;
  }
  if (typeof value === "string" && value.trim() === "") {
    return DESCRIPTION_EMPTY;
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => (item === null || item === undefined ? "" : String(item).trim()))
      .filter((item) => item.length > 0);
    return parts.length > 0 ? parts.join("、") : DESCRIPTION_EMPTY;
  }
  return String(value);
};
