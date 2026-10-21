/**
 * 录入框中的一项已选内容。
 *
 * @author jy
 * @since 1.0.0
 */
export interface InSelectionItem {
  /** 唯一标识，用作列表 key 与 remove 事件载荷。 */
  id: string;
  /** 展示名称，同时用于头像缩写。 */
  name: string;
  /** 头像图片地址，缺省时显示主题色圆形与名字最后一位。 */
  avatar?: string;
  /** 单项是否可删除，缺省时跟随录入框 `closable`。 */
  closable?: boolean;
}

/** 录入框尺寸。 */
export type InSelectionFieldSize = "default" | "small";
