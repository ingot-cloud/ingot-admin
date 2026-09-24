<template>
  <in-drawer :title="title" v-model="visible" :loading="loading" size="520px">
    <in-form label-position="top">
      <el-form-item label="所属资源" required>
        <el-select
          v-model="draft.resourceId"
          :disabled="resourceLocked"
          filterable
          placeholder="请选择所属资源"
        >
          <el-option
            v-for="item in resources"
            :key="item.record.id"
            :label="`${item.record.name} (${item.record.code})`"
            :value="item.record.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="操作码" required>
        <el-input v-if="editing" :model-value="draft.code" disabled placeholder="不可修改" />
        <el-input
          v-else
          v-model="draft.code"
          :disabled="!codePrefix"
          placeholder="请输入操作编码末段"
        >
          <template #prefix>
            <span class="text-[var(--el-text-color-secondary)]">{{ codePrefix }}</span>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="名称" required>
        <el-input v-model="draft.name" placeholder="请输入操作名称" />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" @in-click="privateSubmit">保存</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import type { AppActionRecord, AppResourceRecord, ResourceDetail } from "@ingot/admin-common";
import { PlatformActionCreateAPI, PlatformActionUpdateAPI } from "@/api/iam/catalog";
import { ACTION_CODE_SEPARATOR, actionCodePrefix } from "../actionCode";

defineOptions({ name: "ActionEditDrawer" });

const props = defineProps<{
  submit?: (input: { resourceId: string; code: string; name: string }, editing?: ResourceDetail<AppActionRecord>) => void | Promise<void>;
}>();

const emits = defineEmits<{ success: []; close: [] }>();
const visible = ref(false);
const loading = ref(false);
const applicationId = ref("");
const applicationCode = ref("");
const resources = ref<Array<ResourceDetail<AppResourceRecord>>>([]);
const editing = ref<ResourceDetail<AppActionRecord>>();
const lockResource = ref(false);
const draft = reactive({
  resourceId: "",
  code: "",
  name: "",
});

watch(visible, (open, wasOpen) => {
  if (wasOpen && !open) {
    emits("close");
  }
});

const title = computed(() => (editing.value ? "编辑操作" : "创建操作"));
const resourceLocked = computed(() => Boolean(editing.value) || lockResource.value);
const selectedResource = computed(() =>
  resources.value.find((item) => item.record.id === draft.resourceId),
);
const codePrefix = computed(() =>
  actionCodePrefix(applicationCode.value, selectedResource.value?.record.code),
);

const privateSubmit = (): void => {
  if (!draft.resourceId || !draft.name.trim() || (!editing.value && !draft.code.trim())) {
    Message.warning("请填写资源、操作码和名称");
    return;
  }
  if (!editing.value && (draft.code.includes("*") || draft.code.includes(ACTION_CODE_SEPARATOR))) {
    Message.warning("操作码末段不得包含通配符或冒号");
    return;
  }
  loading.value = true;
  const payload = {
    resourceId: draft.resourceId,
    code: draft.code.trim(),
    name: draft.name.trim(),
  };
  const done = (): void => {
    Message.success("保存成功");
    visible.value = false;
    emits("success");
  };
  if (props.submit) {
    Promise.resolve(props.submit(payload, editing.value))
      .then(done)
      .finally(() => {
        loading.value = false;
      });
    return;
  }
  if (editing.value) {
    PlatformActionUpdateAPI(applicationId.value, editing.value.record.id, {
      expectedVersion: editing.value.version,
      name: draft.name.trim(),
    })
      .then(done)
      .finally(() => {
        loading.value = false;
      });
    return;
  }
  PlatformActionCreateAPI(applicationId.value, payload)
    .then(done)
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show(
    appId: string,
    resourceList: Array<ResourceDetail<AppResourceRecord>>,
    target?: ResourceDetail<AppActionRecord>,
    preferredResourceId?: string,
    locked = false,
    appCode = "",
  ) {
    applicationId.value = appId;
    applicationCode.value = appCode;
    resources.value = resourceList;
    editing.value = target;
    lockResource.value = locked;
    draft.resourceId = target?.record.resourceId || preferredResourceId || resourceList[0]?.record.id || "";
    draft.code = target?.record.code ?? "";
    draft.name = target?.record.name ?? "";
    visible.value = true;
  },
});
</script>
