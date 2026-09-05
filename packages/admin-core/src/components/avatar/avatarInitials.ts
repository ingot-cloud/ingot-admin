/**
 * 无头像时圆圈内的姓名缩写：不超过两个字用全文，超过则取最后两个字。
 */
export const avatarInitials = (name?: string): string => {
  const text = name?.trim() ?? "";
  if (!text) {
    return "";
  }
  return text.length <= 2 ? text : text.slice(-2);
};
