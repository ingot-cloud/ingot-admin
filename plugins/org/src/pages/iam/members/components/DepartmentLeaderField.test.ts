import type { Ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DepartmentLeaderField from "./DepartmentLeaderField.vue";
import { MemberStatus, type DepartmentLeaderPage } from "@ingot/admin-common";

const state = vi.hoisted(() => ({
  leaders: vi.fn(),
  version: undefined as Ref<string> | undefined,
}));
vi.mock("@/api/iam/directory", () => ({
  TenantDepartmentLeadersAPI: state.leaders,
  TenantDepartmentLeaderCandidatesAPI: vi.fn(),
  TenantOrganizationMemberBrowseAPI: vi.fn(),
}));
vi.mock("@ingot/admin-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ingot/admin-core")>();
  const { ref } = await import("vue");
  state.version = ref("v1");
  return {
    ...actual,
    useCapabilities: () => ({
      contextEpoch: ref(0),
      version: state.version!,
      unavailable: ref(false),
      actionCodes: ref([]),
    }),
  };
});
vi.mock("@ingot/admin-common", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ingot/admin-common")>();
  const { defineComponent } = await import("vue");
  return {
    ...actual,
    BizTenantMemberSelect: defineComponent({
      name: "MemberSelectStub",
      props: ["relation", "modelValue", "options", "primaryMemberId", "loadBound", "selectedTotal"],
      emits: ["confirm", "update:modelValue"],
      template: '<div data-member-select><slot name="selection"/></div>',
    }),
  };
});
const people = (count: number, start = 0) =>
  Array.from({ length: count }, (_, offset) => ({
    memberId: String(start + offset + 1),
    displayName: `成员${start + offset + 1}`,
    avatar: `https://images.example/member-${start + offset + 1}.png`,
    available: true,
    departments: [{ id: "10", name: "研发部" }],
  }));
const response = (count = 20, total = 21, page = 1) => ({
  data: {
    items: people(count, (page - 1) * 20),
    total,
    page,
    pageSize: 20,
    primaryLeader: { memberId: "1" },
    restricted: false,
  },
});
const create = () =>
  mount(DepartmentLeaderField, {
    props: { departmentId: "10", editing: true, canRead: true },
    global: {
      stubs: {
        InLoading: { template: "<div><slot/></div>" },
        InButton: true,
      },
    },
  });
beforeEach(() => {
  vi.clearAllMocks();
  state.version!.value = "v1";
  state.leaders.mockResolvedValue(response());
});
describe("部门负责人已选快照", () => {
  it("详情首屏直接回显和复用，退出编辑不重复查询；仅空集合显示横杠", async () => {
    const first: DepartmentLeaderPage = {
      items: [
        {
          memberId: "1",
          displayName: "负责人",
          avatar: "https://images.example/leader.png",
          status: MemberStatus.ACTIVE,
          available: true,
          primary: true,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      departmentVersion: "0",
      restricted: false,
    };
    const aggregated = mount(DepartmentLeaderField, {
      props: { departmentId: "10", editing: true, canRead: true, initialPage: first },
      global: { stubs: { InLoading: { template: "<div><slot/></div>" }, InButton: true } },
    });
    await flushPromises();
    expect(state.leaders).not.toHaveBeenCalled();
    expect(
      aggregated.findComponent({ name: "MemberSelectStub" }).props("relation").initialBoundPage
        .total,
    ).toBe(1);
    await aggregated.setProps({ editing: false });
    expect(aggregated.text()).toContain("负责人");
    expect(aggregated.find(".iam-member-chip__primary").text()).toBe("部门主负责人");
    expect(aggregated.find("img").attributes("src")).toBe("https://images.example/leader.png");
    expect(state.leaders).not.toHaveBeenCalled();
    await aggregated.setProps({ initialPage: { ...first, items: [], total: 0 } });
    expect(aggregated.text()).toBe("-");
    await aggregated.setProps({ initialPage: { ...first, items: [], total: 0, restricted: true } });
    expect(aggregated.text()).toContain("负责人信息受限");
    expect(state.leaders).not.toHaveBeenCalled();
    aggregated.unmount();
  });
  it("传递外层首屏，确认后保留连续快照及增删草稿供再次打开", async () => {
    state.leaders.mockResolvedValueOnce(response(20, 25));
    const wrapper = create();
    await flushPromises();
    const select = wrapper.findComponent({ name: "MemberSelectStub" });
    const first = select.props("relation").initialBoundPage;
    expect(state.leaders).toHaveBeenCalledExactlyOnceWith("10", 1);
    expect(first).toMatchObject({ total: 25, current: 1, size: 20 });
    expect(first.records).toHaveLength(20);
    expect(first.records[0].summary).toBe("研发部");
    expect(first.records[0].avatar).toBe("https://images.example/member-1.png");

    state.leaders.mockResolvedValueOnce(response(1, 21, 2));
    const next = await select.props("loadBound")({ current: 2, size: 20 });
    const records = [...first.records, ...next.records];
    const added = { id: "100", name: "新负责人" };
    const draft = [...records.slice(1), added];
    select.vm.$emit(
      "update:modelValue",
      draft.map((item) => item.id),
    );
    select.vm.$emit(
      "confirm",
      draft,
      "100",
      { added: [added], removedIds: ["1"] },
      { ...first, records, current: 2, total: next.total },
    );
    await flushPromises();
    const relation = select.props("relation");
    expect(relation.initialBoundPage.records).toHaveLength(21);
    expect(relation.initialBoundPage.current).toBe(2);
    expect(relation.boundIds).toHaveLength(21);
    expect(relation.removedIds).toEqual(["1"]);
    expect(relation.added).toEqual([added]);
    expect(select.props("primaryMemberId")).toBe("100");
    expect(select.props("selectedTotal")).toBe(21);
    expect(wrapper.emitted("change")?.at(-1)).toEqual([
      { addMemberIds: ["100"], removeMemberIds: ["1"], primaryMemberId: "100" },
    ]);
    expect(state.leaders).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it("切换部门和权限版本后失效旧快照，迟到响应不能回填", async () => {
    let resolveOld!: (value: ReturnType<typeof response>) => void;
    state.leaders.mockImplementationOnce(() => new Promise((resolve) => (resolveOld = resolve)));
    const wrapper = create();
    await wrapper.setProps({ departmentId: "11" });
    await flushPromises();
    const select = wrapper.findComponent({ name: "MemberSelectStub" });
    expect(state.leaders).toHaveBeenLastCalledWith("11", 1);
    expect(select.props("relation").initialBoundPage.records).toHaveLength(20);
    resolveOld(response(1, 1));
    await flushPromises();
    expect(select.props("relation").initialBoundPage.records).toHaveLength(20);

    let resolveNew!: (value: ReturnType<typeof response>) => void;
    state.leaders.mockImplementationOnce(() => new Promise((resolve) => (resolveNew = resolve)));
    state.version!.value = "v2";
    await flushPromises();
    expect(state.leaders).toHaveBeenCalledTimes(3);
    expect(select.props("relation").initialBoundPage).toBeUndefined();
    expect(select.props("selectedTotal")).toBe(0);
    expect(select.props("modelValue")).toEqual([]);
    expect(select.props("primaryMemberId")).toBeUndefined();
    expect(wrapper.emitted("change")?.at(-1)).toEqual([]);
    resolveNew(response(2, 2));
    await flushPromises();
    expect(select.props("relation").initialBoundPage).toMatchObject({ total: 2, current: 1 });
    expect(select.props("relation").initialBoundPage.records).toHaveLength(2);
    wrapper.unmount();
  });
});
