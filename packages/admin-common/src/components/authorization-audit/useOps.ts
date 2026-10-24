import { AuthorizationDomain, type AuditChangeType } from "../../models/iam/constants";
import { computed, ref, watch, type MaybeRefOrGetter, toValue } from "vue";
import { toApiInstant, parseInstantDate } from "@ingot/shared";
import {
  useCapabilities,
  useCursorPaging,
  usePermissions,
  resolveStringPickerFilter,
  toStringPickerValue,
  type InTableFeedback,
  type Page,
} from "@ingot/admin-core";
import {
  type AuditCursorPage,
  type AuditEntry,
  type AuditReferences,
  type AuthorizationAuditQuery,
  type ResourceDetail,
} from "../../models/iam/types";
import type { IamSelectOption } from "../../models/iam/helpers";
import type { OrganizationMemberParams } from "../organizationMemberPicker";
import type { createIamCursorQueryOptions } from "../../api/iam/page-options";

export interface AuditLockedTarget {
  type: string;
  id: string;
}

export interface AuditOptions {
  domain: AuthorizationDomain;
  readAction: string;
  queryOptions: ReturnType<
    typeof createIamCursorQueryOptions<AuditCursorPage, AuthorizationAuditQuery>
  >;
  loadActorMembers: (params: OrganizationMemberParams) => Promise<Page<IamSelectOption>>;
  lockedTarget?: MaybeRefOrGetter<AuditLockedTarget | undefined>;
}

export const useOps = (options: AuditOptions) => {
  const permissions = usePermissions();
  const { unavailable, hasAction, contextEpoch } = useCapabilities();
  const action = computed(() => options.readAction);
  const canRead = computed(() => permissions.domain === options.domain && hasAction(action.value));
  const locked = computed(() => toValue(options.lockedTarget));
  const paging = useCursorPaging<AuditCursorPage, AuthorizationAuditQuery>({
    queryOptions: options.queryOptions,
    initialCondition: locked.value
      ? { targetType: locked.value.type, targetId: locked.value.id }
      : {},
    enabled: () => canRead.value,
  });
  const title = computed(() =>
    options.domain === AuthorizationDomain.PLATFORM ? "平台授权审计" : "当前组织授权审计",
  );
  const feedback = computed<InTableFeedback>(() => {
    if (unavailable.value || !action.value) return "error";
    const error = paging.query.error.value;
    if (
      !canRead.value ||
      (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ActionDenied")
    )
      return "unauthorized";
    if (paging.query.isError.value) return "error";
    return Object.values(paging.submitted.value).some(Boolean) ? "no-result" : "empty";
  });
  const references = computed<AuditReferences>(() => paging.data.value?.references ?? {});
  const records = computed<Array<ResourceDetail<AuditEntry>>>(() =>
    feedback.value === "error" || feedback.value === "unauthorized" ? [] : paging.records.value,
  );
  const changeFilter = computed({
    get: () => toStringPickerValue(paging.condition.changeType),
    set: (value: string | number | boolean | null) => {
      paging.condition.changeType = resolveStringPickerFilter(value) as AuditChangeType | undefined;
      paging.search();
    },
  });
  const targetTypeFilter = computed({
    get: () => toStringPickerValue(paging.condition.targetType),
    set: (value: string | number | boolean | null) => {
      paging.condition.targetType = resolveStringPickerFilter(value);
      if (!locked.value) paging.condition.targetId = undefined;
      paging.search();
    },
  });
  const timeRange = computed<[Date, Date] | null>({
    get: (): [Date, Date] | null => {
      const from = parseInstantDate(paging.condition.from);
      const until = parseInstantDate(paging.condition.until);
      return from && until ? [from, until] : null;
    },
    set: (value: [Date, Date] | null) => {
      paging.condition.from = toApiInstant(value?.[0]);
      paging.condition.until = toApiInstant(value?.[1]);
      paging.search();
    },
  });
  const extraFilterCount = computed(
    () =>
      [
        locked.value ? undefined : paging.condition.targetType,
        paging.condition.changeType,
        paging.condition.from || paging.condition.until,
      ].filter(Boolean).length,
  );
  const resetExtraFilters = (): void => {
    if (!locked.value) {
      paging.condition.targetType = undefined;
      paging.condition.targetId = undefined;
    }
    paging.condition.changeType = undefined;
    paging.condition.from = undefined;
    paging.condition.until = undefined;
    paging.search();
  };
  const setActor = (memberId?: string): void => {
    paging.condition.actorMemberId = memberId || undefined;
    paging.search();
  };
  const detail = ref<ResourceDetail<AuditEntry>>();
  const detailVisible = ref(false);
  const openDetail = (row: ResourceDetail<AuditEntry>): void => {
    if (!canRead.value) return;
    detail.value = row;
    detailVisible.value = true;
  };
  watch(locked, (target) => {
    paging.condition.targetType = target?.type;
    paging.condition.targetId = target?.id;
    paging.search();
  });
  watch(
    () => [contextEpoch.value, permissions.domain, permissions.tenantId, permissions.memberId],
    () => {
      detailVisible.value = false;
      detail.value = undefined;
      paging.resetSubmitted(
        locked.value ? { targetType: locked.value.type, targetId: locked.value.id } : {},
      );
    },
  );
  watch(canRead, (allowed) => {
    if (!allowed) {
      detailVisible.value = false;
      detail.value = undefined;
    }
  });
  return {
    paging,
    records,
    references,
    title,
    feedback,
    canRead,
    action,
    changeFilter,
    targetTypeFilter,
    timeRange,
    extraFilterCount,
    resetExtraFilters,
    setActor,
    locked,
    detail,
    detailVisible,
    openDetail,
  };
};
