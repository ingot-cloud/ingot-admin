<template>
  <in-drawer
    class="resource-edit-drawer"
    :title="title"
    v-model="visible"
    :loading="loading"
    layout="pinned"
    size="720px"
  >
    <in-form class="resource-edit-form" label-position="top">
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
      <el-form-item class="field-cap-item">
        <template #label>
          <span>字段能力</span>
          <in-button text type="primary" @click.stop.prevent="privateAddField">添加字段</in-button>
        </template>
        <div v-if="draft.fieldCapabilities.length === 0" class="field-cap__empty">暂未声明字段</div>
        <div v-else class="field-cap">
          <div
            v-for="(field, index) in draft.fieldCapabilities"
            :key="index"
            class="field-cap__group"
          >
            <div class="field-cap__body">
              <div class="field-cap__line">
                <span class="field-cap__label">字段键</span>
                <el-input v-model="field.key" placeholder="如 phone" />
              </div>
              <div class="field-cap__line">
                <span class="field-cap__label">展示名</span>
                <el-input v-model="field.label" placeholder="如手机号" />
              </div>
              <div class="field-cap__line">
                <span class="field-cap__label">可见性</span>
                <el-checkbox-group v-model="field.visibilities">
                  <el-checkbox
                    v-for="item in visibilityOptions"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
              <div class="field-cap__line">
                <span class="field-cap__label">操作能力</span>
                <div class="field-cap__flags">
                  <el-checkbox v-model="field.editable">可编辑</el-checkbox>
                  <el-checkbox v-model="field.filterable">可筛选</el-checkbox>
                  <el-checkbox v-model="field.sortable">可排序</el-checkbox>
                </div>
              </div>
            </div>
            <div class="field-cap__action">
              <in-button text type="danger" @click="privateRemoveField(index)">移除</in-button>
            </div>
          </div>
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

<style lang="postcss" scoped>
.resource-edit-form {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.field-cap-item {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.field-cap-item :deep(.el-form-item__label) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.field-cap-item :deep(.el-form-item__content) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.field-cap__empty {
  color: var(--in-text-color-placeholder);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
}

.field-cap {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--in-space-3);
  min-height: 0;
  overflow-y: auto;
}

.field-cap__group {
  display: flex;
  flex: none;
  align-items: stretch;
  overflow: hidden;
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-control);
  background: var(--in-bg-color-surface);
}

.field-cap__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--in-space-3);
  min-width: 0;
  padding: var(--in-space-3);
}

.field-cap__line {
  display: grid;
  grid-template-columns: 4.5em minmax(0, 1fr);
  align-items: center;
  column-gap: var(--in-space-3);
  min-width: 0;
}

.field-cap__label {
  color: var(--in-text-color-placeholder);
  font-size: var(--in-font-size-caption);
  line-height: var(--in-line-height-body);
}

.field-cap__action {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 72px;
  border-left: 1px solid var(--in-border-color);
  background: var(--in-bg-color-hover);
}

.field-cap__flags,
.field-cap__line :deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  min-width: 0;
  column-gap: var(--in-space-3);
  row-gap: var(--in-space-1);
}

.field-cap__line :deep(.el-checkbox) {
  margin-right: 0;
  height: auto;
}
</style>
