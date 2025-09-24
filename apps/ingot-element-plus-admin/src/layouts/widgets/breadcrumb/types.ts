export interface BreadCrumbRecord {
  path: string;
  title: string;
  icon?: string;
  redirect?: string;
  children?: Array<BreadCrumbRecord>;
}
