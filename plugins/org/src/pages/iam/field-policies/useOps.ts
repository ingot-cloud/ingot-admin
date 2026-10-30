import type { InTableAction } from "@ingot/admin-core";
import type { PolicyRuleRow } from "./table";

export const useOps = (
  edit: (row: PolicyRuleRow) => void,
  remove: (row: PolicyRuleRow) => void,
  busy: () => boolean,
) => {
  const rowActionsOf = (row: PolicyRuleRow): Array<InTableAction<PolicyRuleRow>> => [
    { key: "edit", label: "编辑", kind: "default", disabled: busy(), onSelect: () => edit(row) },
    {
      key: "delete",
      label: "删除",
      kind: "danger",
      disabled: busy(),
      confirm: "确定删除这条规则？",
      onSelect: () => remove(row),
    },
  ];
  return { rowActionsOf };
};
