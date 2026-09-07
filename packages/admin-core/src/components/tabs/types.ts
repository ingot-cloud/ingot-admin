export interface TabItem {
  id: string;
  title: string;
}

export type InBizTabsBeforeChange = (nextId: string) => boolean | Promise<boolean>;
