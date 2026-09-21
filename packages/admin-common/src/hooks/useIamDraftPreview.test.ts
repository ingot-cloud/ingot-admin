import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { useIamDraftPreview } from "./useIamDraftPreview";
import type { Preview } from "../models/iam";

const ok = (version: string): Preview => ({
  version,
  valid: true,
  errors: [],
  warnings: [],
});

describe("useIamDraftPreview", () => {
  it("草稿变化清除旧预览，迟到响应不回填", async () => {
    const epoch = ref(1);
    let release!: (value: Preview) => void;
    const first = new Promise<Preview>((resolve) => {
      release = resolve;
    });
    const calls: number[] = [];
    const { preview, bumpDraft, runPreview } = useIamDraftPreview<string>({
      contextEpoch: epoch,
      preview: async (_draft, revision) => {
        calls.push(revision);
        if (revision === 0) {
          return first;
        }
        return ok("new");
      },
    });

    const pending = runPreview("a");
    bumpDraft();
    release(ok("stale"));
    await pending;
    expect(preview.value).toBeNull();

    await runPreview("b");
    expect(preview.value?.version).toBe("new");
    expect(calls).toEqual([0, 1]);
  });

  it("contextEpoch 变化后丢弃旧预览响应", async () => {
    const epoch = ref("e1");
    let release!: (value: Preview) => void;
    const first = new Promise<Preview>((resolve) => {
      release = resolve;
    });
    const { preview, runPreview } = useIamDraftPreview<string>({
      contextEpoch: epoch,
      preview: async () => first,
    });

    const pending = runPreview("a");
    epoch.value = "e2";
    release(ok("old-epoch"));
    await pending;
    expect(preview.value).toBeNull();
  });
});
