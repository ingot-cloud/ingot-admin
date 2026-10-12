import { effectScope, nextTick, ref } from "vue";
import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ConfigurationStatus,
  RoleKind,
  type ResourceDetail,
  type RoleRevision,
  type RoleGrantList,
  type RoleRevisionDistribution,
  type RoleSummary,
} from "@ingot/admin-common";
import type { Page, R } from "@ingot/admin-core";
import { useRoleDetailData } from "./useRoleDetailData";

const response = <T>(data: T): R<T> => ({ code: "S0200", message: "ok", success: true, data });
const role = (id: string, kind = RoleKind.PLATFORM_CUSTOM): ResourceDetail<RoleSummary> => ({
  record: { id, code: id, name: id, kind, status: ConfigurationStatus.ENABLED },
  capabilities: {},
  fieldAccess: {},
  version: "0",
});
const revision = (id: string): ResourceDetail<RoleRevision> => ({
  record: {
    id,
    roleId: "40",
    revision: "2",
    kind: RoleKind.PLATFORM_CUSTOM,
    grants: [],
    deltas: [],
    parameterDefinitions: [],
  },
  capabilities: {},
  fieldAccess: {},
  version: "2",
});
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const scopes: ReturnType<typeof effectScope>[] = [];
afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop());
});
const settle = async () => {
  await nextTick();
  await flushPromises();
  await nextTick();
};
const setup = () => {
  const tab = ref("grants"),
    visible = ref(true),
    governed = ref(true);
  const get = vi.fn(async (id: string) => response(role(id)));
  const grants = vi.fn<(id: string) => Promise<R<RoleGrantList>>>(async () =>
    response({ items: [], revision: { id: "31", revision: "2", versionName: "当前权限" } }),
  );
  const revisions = vi.fn(async (_id: string, page: Page) =>
    response({ ...page, total: 2, records: [revision("31")] }),
  );
  const distribution = vi.fn<(id: string) => Promise<R<RoleRevisionDistribution[]>>>(async () =>
    response([{ revisionId: "30", revision: "1", count: 4 }]),
  );
  const list = vi.fn(async (_id: string, page: Page) =>
    response({ ...page, total: 0, records: [] }),
  );
  const scope = effectScope();
  scopes.push(scope);
  const data = scope.run(() =>
    useRoleDetailData(
      {
        get,
        grants,
        revisions,
        applications: () => ({ distribution, list }),
        canGovern: () => governed.value,
      },
      tab,
      visible,
    ),
  )!;
  return { data, tab, visible, governed, get, grants, revisions, distribution, list };
};

describe("角色详情按区域加载", () => {
  it("首屏并行读取元数据和权限；统计不阻塞主骨架，也不预取两个列表", async () => {
    const f = setup();
    const pendingRole = deferred<ReturnType<typeof response<ResourceDetail<RoleSummary>>>>();
    const pendingDistribution = deferred<Awaited<ReturnType<typeof f.distribution>>>();
    f.get.mockReturnValueOnce(pendingRole.promise);
    f.distribution.mockReturnValueOnce(pendingDistribution.promise);
    f.data.open("40");
    expect(f.get).toHaveBeenCalledTimes(1);
    expect(f.grants).toHaveBeenCalledTimes(1);
    expect(f.distribution).not.toHaveBeenCalled();
    await settle();
    expect(f.data.latestRevision.value?.id).toBe("31");
    pendingRole.resolve(response(role("40")));
    await settle();
    expect(f.data.loading.value).toBe(false);
    expect(f.data.grantLoading.value).toBe(false);
    expect(f.data.distributionLoading.value).toBe(true);
    expect(f.revisions).not.toHaveBeenCalled();
    expect(f.list).not.toHaveBeenCalled();
    pendingDistribution.resolve(response([]));
    await settle();
    expect(f.data.distributionLoading.value).toBe(false);
  });

  it("统计失败只影响统计区，重试不重新读角色和权限", async () => {
    const f = setup();
    f.distribution.mockRejectedValueOnce(new Error("不可用"));
    f.data.open("40");
    await settle();
    expect(f.data.distributionError.value).toBe(true);
    expect(f.data.loading.value).toBe(false);
    expect(f.data.detail.value?.record.id).toBe("40");
    expect(f.data.latestRevision.value?.id).toBe("31");
    await f.data.loadDistribution();
    expect(f.data.distributionError.value).toBe(false);
    expect(f.get).toHaveBeenCalledTimes(1);
    expect(f.grants).toHaveBeenCalledTimes(1);
  });

  it("非自定义角色和无治理资格不请求统计或任务", async () => {
    const f = setup();
    f.governed.value = false;
    f.data.open("40");
    await settle();
    f.tab.value = "applications";
    await settle();
    expect(f.distribution).not.toHaveBeenCalled();
    expect(f.list).not.toHaveBeenCalled();
    f.tab.value = "grants";
    f.get.mockResolvedValueOnce(response(role("41", RoleKind.SYSTEM)));
    f.governed.value = true;
    f.data.open("41");
    await settle();
    expect(f.distribution).not.toHaveBeenCalled();
  });

  it("首次进入历史和任务才分页读取，切回来复用并保留页码", async () => {
    const f = setup();
    f.data.open("40");
    await settle();
    f.tab.value = "revisions";
    await settle();
    expect(f.revisions).toHaveBeenLastCalledWith("40", { current: 1, size: 20 });
    f.data.revisionPage.value.current = 2;
    await f.data.loadRevisions();
    f.tab.value = "applications";
    await settle();
    expect(f.list).toHaveBeenLastCalledWith("40", { current: 1, size: 20 });
    await f.data.loadTasks(2);
    f.tab.value = "grants";
    await settle();
    f.tab.value = "revisions";
    await settle();
    f.tab.value = "applications";
    await settle();
    expect(f.revisions).toHaveBeenCalledTimes(2);
    expect(f.list).toHaveBeenCalledTimes(2);
    expect(f.data.revisionPage.value.current).toBe(2);
    expect(f.data.taskPage.value.current).toBe(2);
  });

  it("版本信息保存只刷新一次激活历史页，非激活任务保留 dirty 到下次进入", async () => {
    const f = setup();
    f.data.open("40");
    await settle();
    f.tab.value = "applications";
    await settle();
    f.tab.value = "revisions";
    await settle();
    f.data.refreshVersionMetadata();
    await settle();
    expect(f.revisions).toHaveBeenCalledTimes(2);
    expect(f.list).toHaveBeenCalledTimes(1);
    expect(f.get).toHaveBeenCalledTimes(1);
    expect(f.grants).toHaveBeenCalledTimes(2);
    f.tab.value = "applications";
    await settle();
    expect(f.list).toHaveBeenCalledTimes(2);
  });

  it("基本资料刷新只读详情，应用成功只刷新分布与激活任务", async () => {
    const f = setup();
    f.data.open("40");
    await settle();
    await f.data.loadDetail();
    expect(f.get).toHaveBeenCalledTimes(2);
    expect(f.grants).toHaveBeenCalledTimes(1);
    expect(f.distribution).toHaveBeenCalledTimes(1);
    f.tab.value = "applications";
    await settle();
    f.data.refreshApplications();
    await settle();
    expect(f.get).toHaveBeenCalledTimes(2);
    expect(f.grants).toHaveBeenCalledTimes(1);
    expect(f.distribution).toHaveBeenCalledTimes(2);
    expect(f.list).toHaveBeenCalledTimes(2);
    expect(f.data.canApply.value).toBe(true);
    f.data.refreshPublication();
    expect(f.data.canApply.value).toBe(true);
    await settle();
  });

  it("切换角色使旧历史及任务的迟到结果失效", async () => {
    const f = setup();
    f.data.open("40");
    await settle();
    const history = deferred<Awaited<ReturnType<typeof f.revisions>>>();
    const tasks = deferred<Awaited<ReturnType<typeof f.list>>>();
    f.revisions.mockReturnValueOnce(history.promise);
    f.list.mockReturnValueOnce(tasks.promise);
    f.tab.value = "revisions";
    await settle();
    f.tab.value = "applications";
    await settle();
    f.tab.value = "grants";
    f.data.open("41");
    await settle();
    history.resolve(response({ current: 1, size: 20, total: 9, records: [revision("旧版本")] }));
    tasks.resolve(response({ current: 1, size: 20, total: 9, records: [] }));
    await settle();
    expect(f.data.detail.value?.record.id).toBe("41");
    expect(f.data.revisionPage.value.records).toEqual([]);
    expect(f.data.taskPage.value.total).toBe(0);
  });

  it("关闭抽屉后权限和统计的迟到响应不写入，重开重新加载", async () => {
    const f = setup();
    const grants = deferred<Awaited<ReturnType<typeof f.grants>>>();
    const stats = deferred<Awaited<ReturnType<typeof f.distribution>>>();
    f.grants.mockReturnValueOnce(grants.promise);
    f.distribution.mockReturnValueOnce(stats.promise);
    f.data.open("40");
    await settle();
    f.visible.value = false;
    expect(f.data.detail.value).toBeUndefined();
    grants.resolve(
      response({ items: [], revision: { id: "旧", revision: "1", versionName: "旧" } }),
    );
    stats.resolve(response([{ revisionId: "旧", revision: "1", count: 9 }]));
    await settle();
    expect(f.data.latestRevision.value).toBeUndefined();
    expect(f.data.distribution.value).toEqual([]);
    f.visible.value = true;
    f.data.open("40");
    await settle();
    expect(f.data.latestRevision.value?.id).toBe("31");
    expect(f.grants).toHaveBeenCalledTimes(2);
  });
});
