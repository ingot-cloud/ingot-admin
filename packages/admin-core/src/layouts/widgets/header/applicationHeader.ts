import type { IamApplicationSummary } from "@/models/iam";
import type { InAdminHeaderApplicationGroup } from "@/plugin/header";
import { assertUniqueKeys } from "./assertUniqueKeys";
import { readHeaderValue } from "./readHeaderValue";
import type {
  ResolvedHeaderApplicationGroup,
  ResolvedHeaderNavMenuItem,
} from "./resolveHeaderConfig";

const APPLICATION_FALLBACK_GROUP_KEY = "application-fallback";

const applicationItem = (app: IamApplicationSummary): ResolvedHeaderNavMenuItem => ({
  key: app.id,
  label: app.name,
  icon: app.icon || "ep:monitor",
  disabled: false,
});

/** 按宿主配置对可导航应用分类；不从配置补充授权集合以外的应用。 */
export const resolveApplicationGroups = (
  applications: IamApplicationSummary[],
  groups: InAdminHeaderApplicationGroup[],
): ResolvedHeaderApplicationGroup[] => {
  assertUniqueKeys(
    groups.map((group) => group.key),
    "顶栏应用分类",
  );
  assertUniqueKeys(
    groups.flatMap((group) => group.applicationCodes),
    "顶栏应用分类 code",
  );
  const assignedCodes = new Set(groups.flatMap((group) => group.applicationCodes));
  const resolved = groups.flatMap((group) => {
    const codes = new Set(group.applicationCodes);
    const items = applications.filter((app) => codes.has(app.code)).map(applicationItem);
    return items.length
      ? [
          {
            key: group.key,
            title: readHeaderValue(group.title, ""),
            columns: group.columns,
            items,
          },
        ]
      : [];
  });
  const remaining = applications.filter((app) => !assignedCodes.has(app.code));
  if (remaining.length) {
    let key = APPLICATION_FALLBACK_GROUP_KEY;
    const groupKeys = new Set(groups.map((group) => group.key));
    while (groupKeys.has(key)) key += ":fallback";
    resolved.push({
      key,
      title: groups.length ? "其他应用" : "应用",
      columns: undefined,
      items: remaining.map(applicationItem),
    });
  }
  return resolved;
};
