// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import {
  GrantStatus, RoleKind, ScopeBindingKind, SubjectType,
  type AssignmentRecord, type AuthorizationCandidatesApi, type ResourceDetail,
} from "../models/iam";
import BizIamAssignmentDrawer from "./BizIamAssignmentDrawer.vue";

const selected: ResourceDetail<AssignmentRecord> = {
  version: "1",
  capabilities: {},
  record: {
    id: "90",
    status: GrantStatus.ACTIVE,
    source: "DIRECT",
    assignment: {
      subject: { type: SubjectType.MEMBER, id: "2" },
      roleRevisionRef: { kind: RoleKind.SHARED, id: "50" },
      scopeBindings: { objects_20: { kind: ScopeBindingKind.OBJECTS, ids: ["4"] } },
    },
  },
} as ResourceDetail<AssignmentRecord>;

describe("租户分配资源对象标签", () => {
  it("从当前版本候选获取资源名，界面不暴露内部参数键", async () => {
    const candidates = vi.fn(async () => ({ data: {
      items: [], total: 0, page: 1, pageSize: 1, supported: true, contextLabel: "成员",
    } })) as AuthorizationCandidatesApi;
    const wrapper = mount(BizIamAssignmentDrawer, {
      props: {
        loadMembers: vi.fn(), loadGroups: vi.fn(), loadRoles: vi.fn(),
        listRevisionsApi: vi.fn(), scopeCandidatesApi: candidates,
        createApi: vi.fn(), previewApi: vi.fn(), updateApi: vi.fn(),
      },
      global: { plugins: [createPinia()], stubs: {
        InDrawer: { props: ["modelValue"], template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>' },
        InForm: { template: "<div><slot /></div>" },
        ElFormItem: { props: ["label"], template: "<div>{{ label }}<slot /></div>" },
        ElSelect: true, ElOption: true,
        BizIamChipPageSelect: true, BizIamDelegationCandidatePicker: true,
        BizIamDurationFields: true, BizIamPreviewAlert: true, InButton: true,
      } },
    });
    (wrapper.vm as unknown as { show: (row: ResourceDetail<AssignmentRecord>) => void }).show(selected);
    await flushPromises();
    expect(wrapper.text()).toContain("成员 ·");
    expect(wrapper.text()).not.toContain("objects_20");
    expect(candidates).toHaveBeenCalledWith(expect.objectContaining({
      revisionId: "50", parameterKey: "objects_20", pageSize: 1,
    }));
  });
});
