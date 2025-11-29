import type { TableHeaderRecord } from "@/components/table";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "菜单名称",
    prop: "name",
    width: "200",
  },
  {
    label: "菜单类型",
    prop: "menuType",
    width: "100",
    align: "center",
  },
  {
    label: "图标",
    prop: "icon",
    width: "80",
    align: "center",
  },
  {
    label: "权限编码",
    prop: "permissionCode",
    transform: (v) => v || "-",
    width: "200",
  },
  {
    label: "路由",
    prop: "path",
    width: "150",
  },
  {
    label: "路由名称",
    prop: "routeName",
    hide: true,
  },
  {
    label: "视图路径",
    prop: "viewPath",
    hide: true,
  },
  {
    label: "重定向",
    prop: "redirect",
    hide: true,
  },
  {
    label: "排序",
    prop: "sort",
    width: "80",
    align: "center",
    hide: true,
  },
  {
    label: "隐藏菜单",
    prop: "hidden",
    width: "100",
    align: "center",
    hide: true,
  },
  {
    label: "隐藏面包屑",
    prop: "hideBreadcrumb",
    width: "100",
    align: "center",
    hide: true,
  },
  {
    label: "是否缓存",
    prop: "isCache",
    width: "100",
    align: "center",
    hide: true,
  },
  {
    label: "匹配props",
    prop: "props",
    width: "100",
    align: "center",
    hide: true,
  },
  {
    label: "链接类型",
    prop: "linkType",
    width: "80",
    align: "center",
  },
  {
    label: "组织类型",
    prop: "orgType",
    width: "80",
    align: "center",
  },
  {
    label: "状态",
    prop: "status",
    width: "80",
    align: "center",
  },
  {
    label: "操作",
    width: "280",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];
