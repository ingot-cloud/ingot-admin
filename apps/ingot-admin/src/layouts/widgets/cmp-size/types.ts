interface CmpSizeListItem {
  label: string;
  value: ComponentSize;
}
export const ComponentSizeList: Array<CmpSizeListItem> = [
  {
    label: "默认",
    value: "default",
  },
  {
    label: "较大",
    value: "large",
  },
  {
    label: "较小",
    value: "small",
  },
];
export type ComponentSize = "default" | "large" | "small";
