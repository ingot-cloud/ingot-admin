import { ref, shallowRef, toValue, type MaybeRefOrGetter, type Ref, type ShallowRef } from "vue";
import type { Preview } from "../models/iam";

export interface IamDraftPreviewOptions<TDraft, TResult> {
  contextEpoch: MaybeRefOrGetter<number | string>;
  preview: (
    draft: TDraft,
    draftRevision: number,
    contextEpoch: number | string,
  ) => Promise<Preview<TResult>>;
}

export interface IamDraftPreviewApi<TDraft, TResult> {
  preview: ShallowRef<Preview<TResult> | null>;
  draftRevision: Ref<number>;
  loading: Ref<boolean>;
  bumpDraft: () => void;
  runPreview: (draft: TDraft) => Promise<void>;
}

/**
 * 草稿预览：草稿变化清除可提交状态；响应必须匹配当前 draftRevision 与 contextEpoch。
 */
export function useIamDraftPreview<TDraft, TResult = unknown>(
  options: IamDraftPreviewOptions<TDraft, TResult>,
): IamDraftPreviewApi<TDraft, TResult> {
  const preview = shallowRef<Preview<TResult> | null>(null);
  const draftRevision = ref(0);
  const loading = ref(false);

  const bumpDraft = (): void => {
    draftRevision.value += 1;
    preview.value = null;
    loading.value = false;
  };

  const runPreview = async (draft: TDraft): Promise<void> => {
    const revision = draftRevision.value;
    const epoch = toValue(options.contextEpoch);
    loading.value = true;
    try {
      const result = await options.preview(draft, revision, epoch);
      if (revision !== draftRevision.value || toValue(options.contextEpoch) !== epoch) {
        return;
      }
      preview.value = result;
    } finally {
      if (revision === draftRevision.value) {
        loading.value = false;
      }
    }
  };

  return {
    preview,
    draftRevision,
    loading,
    bumpDraft,
    runPreview,
  };
}
