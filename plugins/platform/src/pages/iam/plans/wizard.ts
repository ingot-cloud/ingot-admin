import { AuthorizationDomain, type PlanApplication } from "@ingot/admin-common";
import { PlatformApplicationPageAPI } from "@/api/iam/catalog";
import type { Page } from "@ingot/admin-core";

export interface PlanAppOption {
  id: string;
  name: string;
  code: string;
  status?: PlanApplication["status"];
}

export const PLAN_WIZARD_STEPS = [
  { title: "基本信息", description: "填写套餐名称与说明" },
  { title: "包含应用", description: "选择套餐关联的组织应用" },
  { title: "预览创建", description: "确认后一次提交" },
] as const;

export const toPlanAppOptions = (applications: PlanApplication[] | undefined): PlanAppOption[] =>
  (applications ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    status: item.status,
  }));

export async function loadTenantApplications(params: {
  current?: number;
  size?: number;
  query?: string;
}): Promise<Page<PlanAppOption>> {
  const response = await PlatformApplicationPageAPI(
    { current: params.current, size: params.size },
    { name: params.query, domain: AuthorizationDomain.TENANT },
  );
  const page = response.data;
  return {
    ...page,
    records: (page.records ?? []).map((item) => ({
      id: item.record.id,
      name: item.record.name,
      code: item.record.code,
      status: item.record.status,
    })),
  };
}
