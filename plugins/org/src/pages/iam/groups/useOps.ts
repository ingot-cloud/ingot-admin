import {
  IamAction,
  objectActionAllowed,
  type GroupEffectiveMemberRecord,
  type GroupUpdateInput,
  type IamListQuery,
  type MemberPickerChanges,
  type ResourceDetail,
} from "@ingot/admin-common";
import { Confirm, Message, useCapabilities, useServerPaging } from "@ingot/admin-core";
import { TenantGroupDetailAPI, TenantGroupUpdateAPI } from "@/api/iam/directory";
import {
  TenantGroupEffectiveMemberPageQueryOptions,
  TenantGroupSummaryPageQueryOptions,
} from "@/api/iam/directory.query";
import { applyMemberChanges } from "./membership";
import type { GroupMemberRow, GroupRow, GroupSummaryRow } from "./table";

export const useOps = () => {
  const { unavailable, hasAction } = useCapabilities();
  const enabled = () => !unavailable.value && hasAction(IamAction.TENANT_GROUP_READ);
  const canReadMembers = () => enabled() && hasAction(IamAction.TENANT_MEMBER_READ);
  const groupPaging = useServerPaging<GroupSummaryRow, IamListQuery>({
    queryOptions: TenantGroupSummaryPageQueryOptions,
    enabled,
  });
  const memberPaging = useServerPaging<GroupEffectiveMemberRecord, IamListQuery>({
    queryOptions: TenantGroupEffectiveMemberPageQueryOptions,
    enabled: canReadMembers,
    queryWhen: (submitted) => Boolean(submitted.groupId),
  });
  const selectedId = ref("");
  const selectedGroup = ref<GroupSummaryRow>();
  let selectionEpoch = 0;
  let pickerRequest = 0;
  let pickerGroup: GroupRow | undefined;
  const saving = ref(false);

  const updateAccess = computed(() => {
    if (!selectedGroup.value) {
      return { allowed: false, message: "请先选择用户组" };
    }
    return objectActionAllowed(selectedGroup.value.capabilities, IamAction.TENANT_GROUP_UPDATE);
  });

  const applyMemberQuery = (groupId: string): void => {
    memberPaging.condition.groupId = groupId;
    if (canReadMembers()) memberPaging.search();
  };

  const selectGroup = (row?: GroupSummaryRow): void => {
    const id = row?.record.id ?? "";
    selectedGroup.value = row;
    if (selectedId.value === id) return;
    selectionEpoch += 1;
    pickerRequest += 1;
    pickerGroup = undefined;
    selectedId.value = id;
    applyMemberQuery(id);
  };

  const refreshGroups = (): void => {
    groupPaging.search();
  };

  const reloadSelected = (): void => {
    if (selectedId.value) applyMemberQuery(selectedId.value);
    void groupPaging.query.refetch();
  };

  const readEditableGroup = async (): Promise<GroupRow | undefined> => {
    const id = selectedId.value;
    if (!id) return;
    const epoch = selectionEpoch;
    const { data } = await TenantGroupDetailAPI(id);
    if (epoch !== selectionEpoch) return;
    const access = objectActionAllowed(data.capabilities, IamAction.TENANT_GROUP_UPDATE);
    if (!access.allowed || data.record.selectionEditable !== true) {
      Message.warning(access.message ?? "当前权限只允许编辑用户组基本信息");
      return;
    }
    return data;
  };

  const prepareMemberPicker = async (): Promise<GroupRow | undefined> => {
    const request = ++pickerRequest;
    pickerGroup = undefined;
    const current = await readEditableGroup();
    if (request !== pickerRequest) return;
    pickerGroup = current;
    return current;
  };

  const commitMembers = async (
    current: GroupRow,
    members: string[],
    confirmText?: string,
  ): Promise<void> => {
    if (saving.value || current.record.id !== selectedId.value) return;
    const epoch = selectionEpoch;
    if (confirmText) await Confirm.warning(confirmText);
    if (saving.value || epoch !== selectionEpoch) return;
    const input: GroupUpdateInput = {
      expectedVersion: current.version,
      group: {
        name: current.record.name,
        description: current.record.description,
        selection: {
          members,
          departments: current.record.selection.departments,
        },
      },
    };
    saving.value = true;
    try {
      await TenantGroupUpdateAPI(current.record.id, input);
      Message.success("已保存");
      if (epoch === selectionEpoch) memberPaging.search();
      void groupPaging.query.refetch();
    } finally {
      saving.value = false;
    }
  };

  const addMembers = async (changes: MemberPickerChanges): Promise<void> => {
    const current = pickerGroup;
    pickerGroup = undefined;
    if (!current) return;
    const previous = current.record.selection.members;
    const next = applyMemberChanges(previous, changes);
    if (next.length === previous.length && next.every((id, index) => id === previous[index]))
      return;
    await commitMembers(current, next);
  };

  const removeMember = async (row: GroupMemberRow): Promise<void> => {
    const current = await readEditableGroup();
    if (!current) return;
    const name = row.member.displayName || row.member.id;
    const groupName = current.record.name;
    const confirmText =
      row.membership.departments.length > 0
        ? `是否将 ${name} 的直接添加关系移出用户组（${groupName}）？移出后此人仍会因部门范围留在组内。`
        : `是否将 ${name} 移出用户组（${groupName}）？`;
    await commitMembers(
      current,
      current.record.selection.members.filter((id) => id !== row.member.id),
      confirmText,
    );
  };

  watch(
    () => groupPaging.pageInfo.value.records,
    (value) => {
      const records = value ?? [];
      if (!records.length) {
        if (selectedId.value) {
          selectGroup(undefined);
        }
        return;
      }
      const current = records.find((item) => item.record.id === selectedId.value);
      selectGroup(current ?? records[0]);
    },
    { immediate: true },
  );

  return {
    groupPaging,
    memberPaging,
    selectedId,
    selectedGroup,
    saving,
    updateAccess,
    selectGroup,
    refreshGroups,
    reloadSelected,
    prepareMemberPicker,
    addMembers,
    removeMember,
  };
};
