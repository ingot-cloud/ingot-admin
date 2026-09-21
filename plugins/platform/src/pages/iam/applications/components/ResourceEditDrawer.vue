<template>
  <in-drawer :title="title" v-model="visible" :loading="loading" size="640px">
    <in-form label-position="top">
      <el-form-item label="编码" required>
        <el-input v-model="draft.code" :disabled="Boolean(editing)" placeholder="应用内唯一" />
      </el-form-item>
      <el-form-item label="名称" required>
        <el-input v-model="draft.name" />
      </el-form-item>
      <el-form-item label="允许范围">
        <el-checkbox-group v-model="draft.scopeCapabilities">
          <el-checkbox v-for="item in scopeOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          范围只声明资源允许的约束类型，实际求值由服务端执行，不是授权本身。
        </div>
      </el-form-item>
      <el-form-item label="字段能力">
        <div class="flex flex-col gap-12px">
          <div
            v-for="(field, index) in draft.fieldCapabilities"
            :key="index"
            class="flex flex-col gap-8px border border-[var(--el-border-color)] rounded-4px p-12px"
          >
            <div class="flex gap-8px">
              <el-input v-model="field.key" placeholder="字段键" />
              <el-input v-model="field.label" placeholder="中文展示名" />
              <in-button text @click="privateRemoveField(index)">移除</in-button>
            </div>
            <el-checkbox-group v-model="field.visibilities">
              <el-checkbox v-for="item in visibilityOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </el-checkbox>
            </el-checkbox-group>
            <div class="flex flex-wrap gap-12px">
              <el-checkbox v-model="field.editable">可编辑</el-checkbox>
              <el-checkbox v-model="field.filterable">可筛选</el-checkbox>
              <el-checkbox v-model="field.sortable">可排序</el-checkbox>
            </div>
          </div>
          <in-button @click="privateAddField">添加字段</in-button>
        </div>
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
import {
  FieldVisibility,
  ScopeKind,
  useFieldVisibilityEnum,
  useScopeKindEnum,
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
const scopeEnum = useScopeKindEnum();
const visibilityEnum = useFieldVisibilityEnum();
const scopeOptions = computed(() => scopeEnum.getOptions());
const visibilityOptions = computed(() => visibilityEnum.getOptions());
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
      draft.fieldCapabilities = target.record.fieldCapabilities.map((item) => ({
        ...item,
        visibilities: [...item.visibilities],
      }));
    } else {
      reset();
    }
    visible.value = true;
  },
});
</script>
