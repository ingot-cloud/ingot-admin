<template>
  <in-drawer :title="title" v-model="visible" :loading="loading" size="560px">
    <el-form label-position="top">
      <el-form-item label="编码" required>
        <el-input v-model="draft.code" :disabled="Boolean(editing)" placeholder="应用内唯一" />
      </el-form-item>
      <el-form-item label="名称" required>
        <el-input v-model="draft.name" />
      </el-form-item>
      <el-form-item label="允许范围">
        <el-checkbox-group v-model="draft.scopeCapabilities">
          <el-checkbox v-for="item in scopeOptions" :key="item" :value="item" :label="item" />
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="字段能力">
        <div class="flex flex-col gap-8px">
          <div v-for="(field, index) in draft.fieldCapabilities" :key="index" class="flex gap-8px">
            <el-input v-model="field.key" placeholder="字段键" />
            <el-input v-model="field.label" placeholder="展示名" />
            <in-button text @click="privateRemoveField(index)">移除</in-button>
          </div>
          <in-button @click="privateAddField">添加字段</in-button>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" @in-click="privateSubmit">保存</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import {
  FieldVisibility,
  ScopeKind,
  type AppResourceDraft,
  type FieldCapability,
  type ResourceDetail,
  type AppResourceRecord,
} from "@ingot/admin-common";
import { PlatformResourceCreateAPI, PlatformResourceUpdateAPI } from "@/api/iam/catalog";

defineOptions({ name: "ResourceEditDrawer" });

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const loading = ref(false);
const applicationId = ref("");
const editing = ref<ResourceDetail<AppResourceRecord>>();
const scopeOptions = Object.values(ScopeKind);
const draft = reactive<AppResourceDraft>({
  code: "",
  name: "",
  scopeCapabilities: [ScopeKind.ALL],
  fieldCapabilities: [],
});

const title = computed(() => (editing.value ? "编辑资源" : "创建资源"));

const emptyField = (): FieldCapability => ({
  key: "",
  label: "",
  visibilities: [FieldVisibility.FULL],
  editable: true,
  filterable: false,
  sortable: false,
});

const reset = (): void => {
  draft.code = "";
  draft.name = "";
  draft.scopeCapabilities = [ScopeKind.ALL];
  draft.fieldCapabilities = [];
};

const privateAddField = (): void => {
  draft.fieldCapabilities.push(emptyField());
};

const privateRemoveField = (index: number): void => {
  draft.fieldCapabilities.splice(index, 1);
};

const privateSubmit = (): void => {
  if (!draft.name.trim() || (!editing.value && !draft.code.trim())) {
    Message.warning("请填写资源编码和名称");
    return;
  }
  loading.value = true;
  const fields = draft.fieldCapabilities.filter((item) => item.key.trim() && item.label.trim());
  const done = (): void => {
    Message.success("保存成功");
    visible.value = false;
    emits("success");
  };
  if (editing.value) {
    PlatformResourceUpdateAPI(applicationId.value, editing.value.record.id, {
      expectedVersion: editing.value.version,
      name: draft.name.trim(),
      scopeCapabilities: draft.scopeCapabilities,
      fieldCapabilities: fields,
    })
      .then(done)
      .finally(() => {
        loading.value = false;
      });
    return;
  }
  PlatformResourceCreateAPI(applicationId.value, {
    code: draft.code.trim(),
    name: draft.name.trim(),
    scopeCapabilities: draft.scopeCapabilities,
    fieldCapabilities: fields,
  })
    .then(done)
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show(appId: string, target?: ResourceDetail<AppResourceRecord>) {
    applicationId.value = appId;
    editing.value = target;
    if (target) {
      draft.code = target.record.code;
      draft.name = target.record.name;
      draft.scopeCapabilities = [...target.record.scopeCapabilities];
      draft.fieldCapabilities = target.record.fieldCapabilities.map((item) => ({ ...item }));
    } else {
      reset();
    }
    visible.value = true;
  },
});
</script>
