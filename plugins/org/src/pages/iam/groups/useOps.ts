import {
  IamAction,
  objectActionAllowed,
  type GroupEffectiveMemberRecord,
  type GroupRecord,
  type GroupUpdateInput,
  type IamListQuery,
  type MemberPickerChanges,
  type ResourceDetail,
} from "@ingot/admin-common";
import { Confirm, Message, useCapabilities, useServerPaging } from "@ingot/admin-core";
import { TenantGroupDetailAPI, TenantGroupUpdateAPI } from "@/api/iam/directory";
import {
  TenantGroupEffectiveMemberPageQueryOptions,
  TenantGroupPageQueryOptions,
} from "@/api/iam/directory.query";
import { applyMemberChanges } from "./membership";
import type { GroupMemberRow, GroupRow } from "./table";

export const useOps = () => {
  const { unavailable } = useCapabilities();
  const enabled = () => !unavailable.value;
  const groupPaging = useServerPaging<ResourceDetail<GroupRecord>, IamListQuery>({
    queryOptions: TenantGroupPageQueryOptions,
    enabled,
  });
  const memberPaging = useServerPaging<GroupEffectiveMemberRecord, IamListQuery>({
    queryOptions: TenantGroupEffectiveMemberPageQueryOptions,
    enabled,
    queryWhen: (submitted) => Boolean(submitted.groupId),
  });
  const selectedId = ref("");
  const selectedDetail = ref<GroupRow>();
  const saving = ref(false);

  const updateAccess = computed(() => {
    if (!selectedDetail.value) {
      return { allowed: false, message: "请先选择用户组" };
    }
    return objectActionAllowed(selectedDetail.value.capabilities, IamAction.TENANT_GROUP_UPDATE);
  });

  const applyMemberQuery = (groupId: string): void => {
    memberPaging.condition.groupId = groupId;
    memberPaging.search();
  };

  const selectGroup = (row?: GroupRow): void => {
    if (!row) {
      selectedId.value = "";
      selectedDetail.value = undefined;
      applyMemberQuery("");
      return;
    }
    selectedId.value = row.record.id;
    selectedDetail.value = row;
    applyMemberQuery(row.record.id);
  };

  const refreshGroups = (): void => {
    groupPaging.search();
  };

  const reloadSelected = (): void => {
    const current = (groupPaging.pageInfo.value.records ?? []).find(
      (item) => item.record.id === selectedId.value,
    );
    if (current) {
      selectGroup(current);
      return;
    }
    if (selectedId.value) {
      applyMemberQuery(selectedId.value);
      void groupPaging.query.refetch();
      return;
    }
    void groupPaging.query.refetch();
  };

  const ensureSelectedDetail = async (): Promise<GroupRow | undefined> => {
    if (!selectedId.value) {
      return undefined;
    }
    const { data } = await TenantGroupDetailAPI(selectedId.value);
    selectedDetail.value = data;
    return data;
  };

  const commitMembers = async (
    current: GroupRow,
    members: string[],
    confirmText?: string,
  ): Promise<void> => {
    if (!updateAccess.value.allowed) {
      Message.warning(updateAccess.value.message ?? "当前对象不允许该操作");
      return;
    }
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
    if (confirmText) {
      await Confirm.warning(confirmText);
    }
    saving.value = true;
    try {
      const { data } = await TenantGroupUpdateAPI(current.record.id, input);
      selectedDetail.value = data;
      Message.success("已保存");
      memberPaging.search();
      void groupPaging.query.refetch();
    } finally {
      saving.value = false;
    }
  };

  const addMembers = async (changes: MemberPickerChanges): Promise<void> => {
    const current = (await ensureSelectedDetail()) ?? selectedDetail.value;
    if (!current) {
      return;
    }
    const next = applyMemberChanges(current.record.selection.members, changes);
    const previous = current.record.selection.members;
    if (next.length === previous.length && next.every((id, index) => id === previous[index])) {
      return;
    }
    await commitMembers(current, next);
  };

  const removeMember = async (row: GroupMemberRow): Promise<void> => {
    const current = (await ensureSelectedDetail()) ?? selectedDetail.value;
    if (!current) {
      return;
    }
    const name = row.member.displayName || row.member.id;
    const groupName = current.record.name;
    const remainsByDepartment = row.membership.departments.length > 0;
    const confirmText = remainsByDepartment
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
      if (current) {
        if (!selectedDetail.value || selectedDetail.value.record.id !== current.record.id) {
          selectGroup(current);
        } else {
          selectedDetail.value = current;
        }
        return;
      }
      selectGroup(records[0]);
    },
  );

  return {
    groupPaging,
    memberPaging,
    selectedId,
    selectedDetail,
    saving,
    updateAccess,
    selectGroup,
    refreshGroups,
    reloadSelected,
    ensureSelectedDetail,
    addMembers,
    removeMember,
  };
};
