import { computed, ref, watch } from "vue";
import { toApiInstant, parseInstantDate } from "@ingot/shared";
import {
  useCapabilities,
  usePermissions,
  useServerPaging,
  resolveStringPickerFilter,
  toStringPickerValue,
  type InTableFeedback,
} from "@ingot/admin-core";
import {
  AuthorizationDomain,
  type AuditChangeType,
  type AuditEntry,
  type AuthorizationAuditQuery,
  type ResourceDetail,
} from "@ingot/admin-common";
import { SecurityAuditPageQueryOptions } from "@/api/iam/policies.query";
import { auditReadAction } from "./display";

export const useOps = () => {
  const permissions = usePermissions();
  const { unavailable, hasAction, contextEpoch } = useCapabilities();
  const action = computed(() => auditReadAction(permissions.domain));
  const canRead = computed(() => !!action.value && hasAction(action.value));
  const paging = useServerPaging<ResourceDetail<AuditEntry>, AuthorizationAuditQuery>({
    queryOptions: SecurityAuditPageQueryOptions,
    enabled: () => canRead.value,
  });
  const title = computed(() =>
    permissions.domain === AuthorizationDomain.PLATFORM ? "平台授权审计" : "当前组织授权审计",
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
  const pageInfo = computed(() => ({
    ...paging.pageInfo.value,
    records:
      feedback.value === "error" || feedback.value === "unauthorized"
        ? []
        : paging.pageInfo.value.records,
  }));
  const changeFilter = computed({
    get: () => toStringPickerValue(paging.condition.changeType),
    set: (value: string | number | boolean | null) => {
      paging.condition.changeType = resolveStringPickerFilter(value) as AuditChangeType | undefined;
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
        paging.condition.targetType,
        paging.condition.targetId,
        paging.condition.changeType,
        paging.condition.from || paging.condition.until,
      ].filter(Boolean).length,
  );
  const resetExtraFilters = (): void => {
    paging.condition.targetType = undefined;
    paging.condition.targetId = undefined;
    paging.condition.changeType = undefined;
    paging.condition.from = undefined;
    paging.condition.until = undefined;
    paging.search();
  };
  const detail = ref<ResourceDetail<AuditEntry>>();
  const detailVisible = ref(false);
  const openDetail = (row: ResourceDetail<AuditEntry>): void => {
    if (!canRead.value) return;
    detail.value = row;
    detailVisible.value = true;
  };
  watch(
    () => [contextEpoch.value, permissions.domain, permissions.tenantId, permissions.memberId],
    () => {
      detailVisible.value = false;
      detail.value = undefined;
      paging.resetSubmitted({});
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
    pageInfo,
    title,
    feedback,
    canRead,
    action,
    changeFilter,
    timeRange,
    extraFilterCount,
    resetExtraFilters,
    detail,
    detailVisible,
    openDetail,
  };
};
