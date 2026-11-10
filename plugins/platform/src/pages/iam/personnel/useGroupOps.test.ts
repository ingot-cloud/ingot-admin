import { nextTick, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  IamAction,
  type GroupRecord,
  type GroupSummary,
  type ResourceDetail,
} from "@ingot/admin-common";
import { useGroupOps } from "./useGroupOps";

const { readDetail, save, usePaging } = vi.hoisted(() => ({
  readDetail: vi.fn(),
  save: vi.fn(),
  usePaging: vi.fn(),
}));

vi.mock("@/api/iam/personnel", () => ({
  PlatformGroupDetailAPI: readDetail,
  PlatformGroupUpdateAPI: save,
}));
vi.mock("@/api/iam/personnel.query", () => ({
  PlatformGroupSummaryPageQueryOptions: {},
  PlatformGroupMemberPageQueryOptions: {},
}));
vi.mock("@ingot/admin-core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@ingot/admin-core")>()),
  Confirm: { warning: vi.fn() },
  Message: { success: vi.fn(), warning: vi.fn() },
  useCapabilities: () => ({ unavailable: ref(false), hasAction: () => true }),
  useServerPaging: usePaging,
}));

const summary = (id: string): ResourceDetail<GroupSummary> => ({
  record: { id, name: id },
  fieldAccess: {},
  capabilities: { [IamAction.PLATFORM_GROUP_UPDATE]: { allowed: true } },
  version: "old-list-version",
});

const detail = (id: string): ResourceDetail<GroupRecord> => ({
  ...summary(id),
  record: {
    ...summary(id).record,
    selection: { members: ["1", "2"], departments: [] },
    selectionEditable: true,
  },
  version: "7",
});

const paging = () => ({
  pageInfo: ref({ records: [] }),
  condition: {},
  query: { refetch: vi.fn() },
  search: vi.fn(),
});

describe("平台用户组按详情编辑", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    usePaging.mockImplementation(paging);
  });

  it("用已选组详情的版本合并选人差量", async () => {
    readDetail.mockResolvedValue({ data: detail("10") });
    const ops = useGroupOps(ref(true));
    ops.selectGroup(summary("10"));
    await ops.prepareMemberPicker();

    await ops.addMembers({ added: [{ id: "3", name: "新成员" }], removedIds: ["1"] });

    expect(save).toHaveBeenCalledWith("10", {
      expectedVersion: "7",
      group: {
        name: "10",
        description: undefined,
        selection: { members: ["2", "3"], departments: [] },
      },
    });
  });

  it("切换组后迟到的旧详情不会清掉新组的编辑会话", async () => {
    let resolve!: (response: { data: ResourceDetail<GroupRecord> }) => void;
    readDetail
      .mockReturnValueOnce(
        new Promise((done) => {
          resolve = done;
        }),
      )
      .mockResolvedValueOnce({ data: detail("20") });
    const ops = useGroupOps(ref(true));
    ops.selectGroup(summary("10"));
    const pending = ops.prepareMemberPicker();
    ops.selectGroup(summary("20"));
    await nextTick();
    await ops.prepareMemberPicker();
    resolve({ data: detail("10") });

    expect(await pending).toBeUndefined();
    await ops.addMembers({ added: [{ id: "3", name: "新成员" }], removedIds: [] });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0]).toBe("20");
  });
});
