import { getAdminRouter, refreshSessionPermissions, usePermissions } from "@ingot/admin-core";
import {
  FieldVisibility,
  MemberStatus,
  type DepartmentTreeRow,
  type MemberDepartmentBinding,
  type MemberProfileInput,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import { defineStore } from "pinia";
import { shallowRef, watch } from "vue";
import { TenantDepartmentTreeAPI, TenantMemberDetailAPI } from "@/api/iam/directory";
import type { DepartmentDisplay } from "./departmentSelection";

const PROFILE_KEYS = ["displayName", "phone", "email", "avatar"] as const;

interface MemberDraft {
  profile: Pick<MemberProfileInput, (typeof PROFILE_KEYS)[number]>;
  departments?: MemberDepartmentBinding[];
}

interface RecoveredDraft {
  detail: ResourceDetail<MemberRecord>;
  profile: MemberDraft["profile"];
  departments?: DepartmentDisplay[];
}

const readableDepartments = (
  draft: MemberDepartmentBinding[],
  record: MemberRecord,
  tree: DepartmentTreeRow[],
): DepartmentDisplay[] => {
  const byId = new Map(record.departments.map(({ id, name }) => [id, { name, path: "" }]));
  const add = (rows: DepartmentTreeRow[], parents: string[]): void => {
    for (const { record: { id, name }, children } of rows) {
      byId.set(id, { name, path: parents.length ? [...parents, name].join("/") : "" });
      add(children ?? [], [...parents, name]);
    }
  };
  add(tree, []);
  return draft.flatMap((item) => {
    const visible = byId.get(item.id);
    return visible ? [{ ...item, ...visible }] : [];
  });
};

/** 403 刷新可能重建成员页。仅在原身份、原路由下交接经重新读取验证的只读草稿。 */
export const useMemberRevokedDraft = defineStore("org.memberRevokedDraft", () => {
  const permissions = usePermissions();
  const router = getAdminRouter();
  const recovered = shallowRef<RecoveredDraft>();
  let attempt = 0;

  const clear = (): void => {
    attempt += 1;
    recovered.value = undefined;
  };

  watch(
    [() => permissions.contextEpoch, () => router.currentRoute.value.fullPath],
    clear,
    { flush: "sync" },
  );

  const recover = async (id: string, draft: MemberDraft): Promise<void> => {
    clear();
    const current = attempt;
    try {
      await refreshSessionPermissions({ refreshMenusIfVersionChanged: true });
      if (current !== attempt) return;
      const { data: detail } = await TenantMemberDetailAPI(id, { feedback: "silent" });
      if (current !== attempt || detail.record.id !== id || detail.record.status === MemberStatus.REMOVED)
        return;
      const profile: MemberDraft["profile"] = {};
      for (const key of PROFILE_KEYS) {
        if (detail.fieldAccess[key]?.visibility === FieldVisibility.FULL && key in draft.profile)
          profile[key] = draft.profile[key];
      }
      let departments: DepartmentDisplay[] | undefined;
      if (draft.departments) {
        const result = await TenantDepartmentTreeAPI({ feedback: "silent" }).catch(() => undefined);
        departments = readableDepartments(draft.departments, detail.record, result?.data ?? []);
      }
      if (current === attempt) recovered.value = { detail, profile, departments };
    } catch {
      // 对象不可读或无法验证时不恢复旧资料。
    }
  };

  const take = (): RecoveredDraft | undefined => {
    const value = recovered.value;
    recovered.value = undefined;
    return value;
  };
  return { recovered, recover, take, clear };
});
