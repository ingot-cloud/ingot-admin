import { afterEach, describe, expect, it, vi } from "vitest";
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import {
  ConfigurationStatus,
  IamAction,
  RoleKind,
  type ResourceDetail,
  type RoleRevision,
  type RoleSummary,
} from "@ingot/admin-common";
import type { R } from "@ingot/admin-core";
import SharedRoleDetailDrawer from "./SharedRoleDetailDrawer.vue";

vi.mock("@ingot/admin-core", async (original) => ({
  ...(await original<object>()),
  useCapabilities: () => ({ hasAction: () => false }),
}));
enableAutoUnmount(afterEach);
const response = <T>(data: T): R<T> => ({ code: "S0200", message: "ok", success: true, data });
const role = (id: string): ResourceDetail<RoleSummary> => ({
  record: {
    id,
    code: "support",
    name: "客服",
    kind: RoleKind.PLATFORM_CUSTOM,
    status: ConfigurationStatus.ENABLED,
  },
  fieldAccess: {},
  capabilities: { [IamAction.PLATFORM_ROLE_PUBLISH]: { allowed: true } },
  version: "7",
});
const source: ResourceDetail<RoleRevision> = {
  record: {
    id: "31",
    roleId: "40",
    revision: "2",
    versionName: "固定版本",
    kind: RoleKind.PLATFORM_CUSTOM,
    grants: [],
    deltas: [],
    parameterDefinitions: [],
    resourceFieldPermissions: {},
  },
  fieldAccess: {},
  capabilities: {},
  version: "2",
};
const setup = () => {
  const show = vi.fn();
  const revisionDetailApi = vi.fn(async () => response(source));
  const revisionGrantsApi = vi.fn(async () => response({ items: [] }));
  const listRevisionsApi = vi.fn();
  const wrapper = mount(SharedRoleDetailDrawer, {
    props: {
      getApi: async (id: string) => response(role(id)),
      listGrantsApi: async () =>
        response({ items: [], revision: { id: "31", revision: "2", versionName: "固定版本" } }),
      listRevisionsApi,
      revisionDetailApi,
      revisionGrantsApi,
      publishAction: IamAction.PLATFORM_ROLE_PUBLISH,
    },
    global: {
      stubs: {
        InDrawer: { template: "<div><slot/><slot name='footer'/></div>" },
        InBizTabs: { template: "<div><slot/></div>" },
        InBizTabPanel: { template: "<div><slot/></div>" },
        InTable: true,
        InFormSkeleton: true,
        InCopyTag: true,
        BizIamStatusTag: true,
        InButton: {
          props: ["disabled"],
          emits: ["in-click"],
          template: "<button :disabled='disabled' @click=\"$emit('in-click')\"><slot/></button>",
        },
        GrantPreview: true,
        GrantEditWizard: { template: "<div/>", methods: { show } },
        BizIamRoleVersionMetadataDialog: true,
      },
    },
  });
  return { wrapper, show, revisionDetailApi, revisionGrantsApi, listRevisionsApi };
};
const open = async (wrapper: ReturnType<typeof setup>["wrapper"], id = "40") => {
  (wrapper.vm as unknown as { show(id: string): void }).show(id);
  await flushPromises();
};

describe("角色详情固定版本编辑", () => {
  it("首屏只用摘要，点击编辑后才读取固定详情及授权，使用角色乐观锁", async () => {
    const f = setup();
    await open(f.wrapper);
    expect(f.wrapper.text()).toContain("v2 · 固定版本");
    expect(f.revisionDetailApi).not.toHaveBeenCalled();
    expect(f.listRevisionsApi).not.toHaveBeenCalled();
    await f.wrapper
      .findAll("button")
      .find((button) => button.text() === "编辑")!
      .trigger("click");
    await flushPromises();
    expect(f.revisionDetailApi).toHaveBeenCalledWith("40", "31");
    expect(f.revisionGrantsApi).toHaveBeenCalledWith("40", "31");
    expect(f.show).toHaveBeenCalledWith(
      expect.objectContaining({
        roleId: "40",
        version: "7",
        sourceRevision: source.record,
        latestRevisionId: "31",
      }),
    );
  });

  it("当前权限详情直接用已加载授权进入编辑，不读取版本", async () => {
    const show = vi.fn();
    const listRevisionsApi = vi.fn();
    const wrapper = mount(SharedRoleDetailDrawer, {
      props: {
        versioned: false,
        getApi: async (id: string) =>
          response({
            ...role(id),
            record: { ...role(id).record, kind: RoleKind.SHARED },
            capabilities: { [IamAction.PLATFORM_SHARED_ROLE_UPDATE]: { allowed: true } },
          }),
        listGrantsApi: async () => response({ items: [] }),
        listRevisionsApi,
        publishAction: IamAction.PLATFORM_SHARED_ROLE_UPDATE,
      },
      global: {
        stubs: {
          InDrawer: { template: "<div><slot/><slot name='footer'/></div>" },
          InBizTabs: { template: "<div><slot/></div>" },
          InBizTabPanel: { template: "<div><slot/></div>" },
          InTable: true,
          InFormSkeleton: true,
          InCopyTag: true,
          BizIamStatusTag: true,
          InButton: {
            props: ["disabled"],
            emits: ["in-click"],
            template: "<button :disabled='disabled' @click=\"$emit('in-click')\"><slot/></button>",
          },
          GrantPreview: true,
          GrantEditWizard: { template: "<div/>", methods: { show } },
          BizIamRoleVersionMetadataDialog: true,
        },
      },
    });
    await open(wrapper);
    expect(wrapper.text()).not.toContain("最新发布版本");
    expect(listRevisionsApi).not.toHaveBeenCalled();
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "编辑")!
      .trigger("click");
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ roleId: "40", version: "7", grants: [] }),
    );
    expect(show.mock.calls[0]?.[0].sourceRevision).toBeUndefined();
  });

  it("切换角色后旧版本详情返回不打开旧角色编辑向导", async () => {
    const f = setup();
    await open(f.wrapper);
    let resolve!: (value: R<ResourceDetail<RoleRevision>>) => void;
    f.revisionDetailApi.mockReturnValueOnce(
      new Promise((yes) => {
        resolve = yes;
      }),
    );
    await f.wrapper
      .findAll("button")
      .find((button) => button.text() === "编辑")!
      .trigger("click");
    await open(f.wrapper, "41");
    resolve(response(source));
    await flushPromises();
    expect(f.show).not.toHaveBeenCalled();
  });
});
