/**
 * 无头像时圆圈内只显示姓名最后一个字，避免小尺寸头像里文字溢出。
 */
export const avatarInitials = (name?: string): string => {
  const text = name?.trim() ?? "";
  if (!text) {
    return "";
  }
  return text.slice(-1);
};
