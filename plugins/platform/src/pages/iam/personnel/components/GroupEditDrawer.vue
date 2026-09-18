<template>
  <in-drawer :title="title" v-model="visible" :loading="loading" size="560px">
    <el-form label-position="top">
      <el-form-item label="名称" required>
        <el-input v-model="draft.name" />
      </el-form-item>
      <el-form-item label="说明">
        <el-input v-model="draft.description" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="成员">
        <el-select v-model="draft.memberIds" multiple filterable placeholder="只可选平台成员，不能选部门">
          <el-option
            v-for="item in members"
            :key="item.record.id"
            :label="item.record.displayName || item.record.id"
            :value="item.record.id"
          />
        </el-select>
      </el-form-item>
      <biz-iam-preview-alert v-if="preview" :preview="preview" />
    </el-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button v-if="editing" @click="privatePreview">预览影响</in-button>
      <in-button type="primary" :loading="loading" :disabled="editing ? !preview?.valid : false" @in-click="privateSubmit">
        保存
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import {
  BizIamPreviewAlert,
  emptySelectionDepartments,
  type GroupDraft,
  type GroupRecord,
  type MemberRecord,
  type Preview,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  PlatformGroupCreateAPI,
  PlatformGroupDetailAPI,
  PlatformGroupPreviewAPI,
  PlatformGroupUpdateAPI,
  PlatformMemberPageAPI,
} from "@/api/iam/personnel";
import { platformGroupQueryKeys } from "@/api/iam/personnel.query";
import { useQueryClient } from "@tanstack/vue-query";
import type { GroupRow } from "../groupTable";

defineOptions({ name: "GroupEditDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const visible = ref(false);
const loading = ref(false);
const editing = ref<ResourceDetail<GroupRecord>>();
const preview = ref<Preview | null>(null);
const members = ref<Array<ResourceDetail<MemberRecord>>>([]);
const draft = reactive({
  name: "",
  description: "",
  memberIds: [] as string[],
});

const title = computed(() => (editing.value ? "编辑组" : "创建组"));

const asDraft = (): GroupDraft => ({
  name: draft.name.trim(),
  description: draft.description.trim() || undefined,
  selection: {
    members: [...draft.memberIds],
    departments: emptySelectionDepartments(),
  },
});

const privatePreview = (): void => {
  if (!editing.value) {
    return;
  }
  loading.value = true;
  PlatformGroupPreviewAPI(editing.value.record.id, {
    expectedVersion: editing.value.version,
    group: asDraft(),
  })
    .then((response) => {
      preview.value = response.data;
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateSubmit = (): void => {
  if (!draft.name.trim()) {
    Message.warning("请输入组名");
    return;
  }
  loading.value = true;
  const done = (): void => {
    Message.success("保存成功");
    void queryClient.invalidateQueries({ queryKey: platformGroupQueryKeys.lists() });
    visible.value = false;
    emits("success");
  };
  if (editing.value) {
    if (!preview.value?.valid) {
      loading.value = false;
      Message.warning("请先预览且预览通过后再提交");
      return;
    }
    PlatformGroupUpdateAPI(editing.value.record.id, {
      expectedVersion: editing.value.version,
      group: asDraft(),
    })
      .then(done)
      .finally(() => {
        loading.value = false;
      });
    return;
  }
  PlatformGroupCreateAPI(asDraft())
    .then(done)
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show(row?: GroupRow) {
    preview.value = null;
    visible.value = true;
    PlatformMemberPageAPI({ current: 1, size: 200 }).then((response) => {
      members.value = response.data.records ?? [];
    });
    if (!row) {
      editing.value = undefined;
      draft.name = "";
      draft.description = "";
      draft.memberIds = [];
      return;
    }
    loading.value = true;
    PlatformGroupDetailAPI(row.record.id)
      .then((response) => {
        editing.value = response.data;
        draft.name = response.data.record.name;
        draft.description = response.data.record.description ?? "";
        draft.memberIds = [...response.data.record.selection.members];
      })
      .finally(() => {
        loading.value = false;
      });
  },
});
</script>
