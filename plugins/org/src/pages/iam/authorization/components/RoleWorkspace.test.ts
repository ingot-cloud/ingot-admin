import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it, vi } from "vitest";
import { ConfigurationStatus, RoleKind } from "@ingot/admin-common";
import RoleWorkspace from "./RoleWorkspace.vue";

const state = vi.hoisted(() => ({
  subjectKind: null as { value: "members" | "groups" } | null,
  memberShow: vi.fn(),
  groupShow: vi.fn(),
  showSources: vi.fn(),
}));
vi.mock("@ingot/admin-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ingot/admin-core")>();
  const { ref } = await import("vue");
  return {
    ...actual,
    useCapabilities: () => ({
      hasAction: () => true,
      unavailable: ref(false),
      contextEpoch: ref(0),
    }),
  };
});
vi.mock("../useRoleWorkspace", async () => {
  const { reactive, ref } = await import("vue");
  const subjectKind = ref<"members" | "groups">("members");
  state.subjectKind = subjectKind;
  return {
    useRoleWorkspace: () => ({
      roleId: ref("1"),
      subjectKind,
      subjects: {
        fetching: ref(false),
        pageInfo: ref({
          records: [
            {
              id: "4",
              name: "张三",
              sourceTypes: ["MEMBER"],
              sourceCount: 2,
              revisionNumbers: [],
            },
          ],
          current: 1,
          size: 20,
          total: 1,
        }),
        condition: reactive({ keyword: "" }),
        fetchData: vi.fn(),
        search: vi.fn(),
      },
      restricted: ref(false),
      refresh: vi.fn(),
      sources: {
        fetching: ref(false),
        pageInfo: ref({ records: [] }),
        fetchData: vi.fn(),
      },
      sourcesVisible: ref(false),
      showSources: state.showSources,
    }),
  };
});

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "RoleWorkspace.vue"),
  "utf8",
);

describe("角色工作区主体列表", () => {
  it("名称打开只读详情，成员点来源数打开来源", () => {
    expect(source).toContain("<biz-iam-record-link");
    expect(source).toContain('@click="showSubject(item)"');
    expect(source).toContain('label: "部门"');
    expect(source).toContain('label: "来源数"');
    expect(source).not.toContain('label: "分配来源"');
    expect(source).toContain("showSources(item.id)");
    expect(source).toContain('<member-detail-drawer ref="memberDetail" view-only />');
    expect(source).toContain('<group-detail-drawer ref="groupDetail" view-only />');
    expect(source).toContain("MemberStatus.ACTIVE");
    expect(source).not.toContain("查看来源");
    expect(source.indexOf("el-pagination")).toBeLessThan(source.indexOf("创建角色"));
    expect(source).toContain('action.key !== "diagnose"');
    expect(source).toContain("查看用户组");
  });

  it("点击名称打开对应的只读详情", async () => {
    const drawer = (name: string, show: (row: unknown) => void) =>
      defineComponent({
        name,
        props: { viewOnly: Boolean },
        setup(_, { expose }) {
          expose({ show });
          return () => null;
        },
      });
    const wrapper = mount(RoleWorkspace, {
      props: {
        active: true,
        loading: false,
        rows: [
          {
            record: {
              id: "1",
              code: "role",
              name: "管理员",
              kind: RoleKind.TENANT_CUSTOM,
              status: ConfigurationStatus.ENABLED,
            },
            capabilities: {},
            fieldAccess: {},
            version: "1",
          },
        ],
        page: { records: [], current: 1, size: 20, total: 0 },
        rowActions: () => [],
      },
      global: {
        stubs: {
          InSplitLayout: { template: "<div><slot name='left'/><slot/></div>" },
          InLoading: { template: "<div><slot/></div>" },
          InTable: {
            props: ["data", "headers"],
            template:
              '<div><span class="headers">{{ (headers || []).map((header) => header.label).join(",") }}</span><div v-for="item in data || []" :key="item.id || item.record?.id"><slot name="name" :item="item"/><slot name="sourceCount" :item="item"/></div></div>',
          },
          InDialog: true,
          InBizTabsHeader: true,
          InTableActions: true,
          InTableColumnSetting: true,
          InIcon: true,
          InTag: true,
          ElInput: true,
          ElPagination: true,
          InButton: {
            emits: ["inClick"],
            template: "<button @click=\"$emit('inClick')\"><slot/></button>",
          },
          BizIamRecordLink: {
            props: ["action"],
            emits: ["click"],
            template: '<button class="name-link" @click="$emit(\'click\')"><slot/></button>',
          },
          MemberDetailDrawer: drawer("MemberDetailDrawer", state.memberShow),
          GroupDetailDrawer: drawer("GroupDetailDrawer", state.groupShow),
        },
      },
    });
    await flushPromises();
    const tables = wrapper.findAll(".headers");
    const subjectHeaders = tables[tables.length - 1]?.text() || "";
    expect(subjectHeaders).toContain("部门");
    expect(subjectHeaders).toContain("来源数");
    expect(subjectHeaders).not.toContain("分配来源");
    expect(subjectHeaders).not.toContain("操作");
    expect(wrapper.text()).toContain("创建角色");
    const sourceCount = wrapper.findAll("button").find((item) => item.text() === "2");
    expect(sourceCount).toBeTruthy();
    await sourceCount!.trigger("click");
    expect(state.showSources).toHaveBeenCalledWith("4");
    await wrapper.get(".name-link").trigger("click");
    expect(state.memberShow).toHaveBeenCalledWith(
      expect.objectContaining({
        record: expect.objectContaining({ id: "4", displayName: "张三" }),
      }),
    );
    expect(wrapper.findComponent({ name: "MemberDetailDrawer" }).props("viewOnly")).toBe(true);
    state.subjectKind!.value = "groups";
    await flushPromises();
    expect(wrapper.findAll(".headers").at(-1)?.text()).toBe("名称");
    expect(wrapper.findAll("button").some((item) => item.text() === "2")).toBe(false);
    await wrapper.get(".name-link").trigger("click");
    expect(state.groupShow).toHaveBeenCalledWith(
      expect.objectContaining({ record: expect.objectContaining({ id: "4", name: "张三" }) }),
    );
    expect(wrapper.findComponent({ name: "GroupDetailDrawer" }).props("viewOnly")).toBe(true);
  });
});
