import {
  emptySelectionDepartments,
  IamAction,
  objectActionAllowed,
  type GroupRecord,
  type GroupUpdateInput,
  type IamListQuery,
  type IamSelectOption,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import { Confirm, Message, useCapabilities, useServerPaging } from "@ingot/admin-core";
import { PlatformGroupUpdateAPI } from "@/api/iam/personnel";
import { PlatformGroupMemberPageQueryOptions, PlatformGroupPageQueryOptions } from "@/api/iam/personnel.query";
import type { GroupRow } from "./groupTable";

export const useGroupOps = () => {
  const { unavailable } = useCapabilities();
  const enabled = () => !unavailable.value;
  const groupPaging = useServerPaging<ResourceDetail<GroupRecord>, IamListQuery>({
    queryOptions: PlatformGroupPageQueryOptions,
    enabled,
  });
  const memberPaging = useServerPaging<ResourceDetail<MemberRecord>, IamListQuery>({
    queryOptions: PlatformGroupMemberPageQueryOptions,
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
    return objectActionAllowed(selectedDetail.value.capabilities, IamAction.PLATFORM_GROUP_UPDATE);
  });
  const memberIds = computed(() => selectedDetail.value?.record.selection.members ?? []);

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
    const current = groupPaging.pageInfo.value.records.find((item) => item.record.id === selectedId.value);
    if (current) {
      selectGroup(current);
    } else if (selectedId.value) {
      selectGroup({
        record: { id: selectedId.value, name: "", selection: { members: [], departments: [] } },
        fieldAccess: {},
        capabilities: {},
        version: "",
      });
    }
    void groupPaging.query.refetch();
  };

  const asUpdateInput = (ids: string[]): GroupUpdateInput | undefined => {
    const current = selectedDetail.value;
    if (!current) {
      return undefined;
    }
    return {
      expectedVersion: current.version,
      group: {
        name: current.record.name,
        description: current.record.description,
        selection: {
          members: ids,
          departments: emptySelectionDepartments(),
        },
      },
    };
  };

  const commitMemberIds = async (ids: string[], confirmText?: string): Promise<void> => {
    const current = selectedDetail.value;
    const input = asUpdateInput(ids);
    if (!current || !input) {
      return;
    }
    if (!updateAccess.value.allowed) {
      Message.warning(updateAccess.value.message ?? "当前对象不允许该操作");
      return;
    }
    if (confirmText) {
      await Confirm.warning(confirmText);
    }
    saving.value = true;
    try {
      const { data } = await PlatformGroupUpdateAPI(current.record.id, input);
      selectedDetail.value = data;
      Message.success("已保存");
      memberPaging.search();
      void groupPaging.query.refetch();
    } finally {
      saving.value = false;
    }
  };

  const addMembers = async (picked: IamSelectOption[]): Promise<void> => {
    const next = picked.map((item) => item.id);
    const current = memberIds.value;
    if (next.length === current.length && next.every((id, index) => id === current[index])) {
      return;
    }
    await commitMemberIds(next);
  };

  const removeMember = async (row: ResourceDetail<MemberRecord>): Promise<void> => {
    const name = row.record.displayName || row.record.id;
    const groupName = selectedDetail.value?.record.name ?? "当前组";
    await commitMemberIds(
      memberIds.value.filter((id) => id !== row.record.id),
      `是否将 ${name} 移出用户组（${groupName}）？`,
    );
  };

  watch(
    () => groupPaging.pageInfo.value.records,
    (records) => {
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
    memberIds,
    selectGroup,
    refreshGroups,
    reloadSelected,
    addMembers,
    removeMember,
  };
};
