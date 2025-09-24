import type { TableHeaderRecord } from "@/components/table";
export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "用户",
    prop: "avatar",
  },
  {
    label: "账号",
    prop: "username",
  },
  {
    label: "昵称",
    prop: "nickname",
    hide: true,
  },
  {
    label: "手机号",
    prop: "phone",
  },
  {
    label: "email",
    prop: "email",
    transform: (v) => v || "-",
  },
  {
    label: "状态",
    prop: "status",
  },
  {
    label: "注册时间",
    prop: "createdAt",
    hide: true,
  },
  {
    label: "操作",
    width: "240",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];
