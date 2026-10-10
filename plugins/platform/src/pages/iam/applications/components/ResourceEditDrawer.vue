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
        <el-input
          v-model="draft.code"
          :disabled="Boolean(editing)"
          :placeholder="editing ? '资源编码不可修改' : '请输入资源编码，应用内唯一'"
        />
      </el-form-item>
      <el-form-item label="名称" required>
        <el-input v-model="draft.name" placeholder="请输入资源名称" />
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
        <el-alert
          v-if="legacyDepartmentScopes.length"
          type="warning"
          :closable="false"
          title="平台应用不支持部门范围；请取消已有部门选项后保存。"
        />
        <div v-if="legacyDepartmentScopes.length" class="flex gap-8px items-center">
          <span>{{
            legacyDepartmentScopes.map((scope) => scopeEnum.getTagText(scope).text).join("、")
          }}</span>
          <in-button text type="danger" @in-click="privateRemoveLegacyScopes"
            >移除部门范围</in-button
          >
        </div>
      </el-form-item>
      <el-form-item class="field-cap-item">
        <ResourceFieldList
          ref="fieldListRef"
          :fields="draft.fieldCapabilities"
          :manifest="manifest"
          :checkable="checkable"
          :binding-error="bindingError"
          @add="privateAddField"
          @edit="privateEditField"
          @remove="privateRemoveField"
          @retry="privateLoadBindings"
        />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" @in-click="privateSubmit">保存</in-button>
    </template>
  </in-drawer>
  <ResourceFieldDialog
    ref="fieldDialogRef"
    :other-keys="otherFieldKeys"
    :manifest="manifest"
    :checkable="checkable"
    :binding-error="bindingError"
    @confirm="privateConfirmField"
  />
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import {
  AuthorizationDomain,
  ScopeKind,
  useScopeKindEnum,
  type AppResourceDraft,
  type FieldCapability,
  type FieldBindingManifest,
  type ResourceDetail,
  type AppResourceRecord,
} from "@ingot/admin-common";
import {
  PlatformResourceCreateAPI,
  PlatformResourceUpdateAPI,
  PlatformResourceBindingsAPI,
} from "@/api/iam/catalog";

import ResourceFieldDialog from "./ResourceFieldDialog.vue";
import ResourceFieldList from "./ResourceFieldList.vue";
import { cloneResourceField, normalizeResourceField, resourceFieldErrors } from "./resourceFields";

defineOptions({ name: "ResourceEditDrawer" });

const props = defineProps<{
  domain: AuthorizationDomain;
  submit?: (
    draft: AppResourceDraft,
    editing?: ResourceDetail<AppResourceRecord>,
  ) => void | Promise<void>;
}>();

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const loading = ref(false);
const manifest = ref<FieldBindingManifest>();
const bindingError = ref(false);
const applicationId = ref("");
const editing = ref<ResourceDetail<AppResourceRecord>>();
const scopeEnum = useScopeKindEnum();
const departmentScopes = [ScopeKind.MEMBER_DEPARTMENTS, ScopeKind.MANAGED_DEPARTMENTS];
const scopeOptions = computed(() =>
  scopeEnum
    .getOptions()
    .filter(
      (item) =>
        props.domain !== AuthorizationDomain.PLATFORM || !departmentScopes.includes(item.value),
    ),
);
const legacyDepartmentScopes = computed(() =>
  props.domain === AuthorizationDomain.PLATFORM
    ? draft.scopeCapabilities.filter((scope) => departmentScopes.includes(scope))
    : [],
);
const draft = reactive<AppResourceDraft>({
  code: "",
  name: "",
  scopeCapabilities: [ScopeKind.ALL],
  fieldCapabilities: [],
});

const title = computed(() => (editing.value ? "编辑资源" : "创建资源"));

const checkable = computed(() => Boolean(editing.value && !props.submit));
const persistedKeys = ref<Set<string>>(new Set());
const fieldDialogRef = ref<InstanceType<typeof ResourceFieldDialog>>();
const fieldListRef = ref<InstanceType<typeof ResourceFieldList>>();
const editingFieldIndex = ref<number>();
const otherFieldKeys = computed(() =>
  draft.fieldCapabilities
    .filter((_, index) => index !== editingFieldIndex.value)
    .map((field) => field.key.trim()),
);
let bindingRequest = 0;
const privateLoadBindings = (): void => {
  if (!editing.value || !checkable.value) return;
  const requestId = ++bindingRequest;
  manifest.value = undefined;
  bindingError.value = false;
  PlatformResourceBindingsAPI(applicationId.value, editing.value.record.id)
    .then((response) => {
      if (visible.value && bindingRequest === requestId) manifest.value = response.data;
    })
    .catch(() => {
      if (visible.value && bindingRequest === requestId) bindingError.value = true;
    });
};
watch(visible, (open) => {
  if (!open) {
    bindingRequest++;
    fieldDialogRef.value?.close();
  }
});

const reset = (): void => {
  draft.code = "";
  draft.name = "";
  draft.scopeCapabilities = [ScopeKind.ALL];
  draft.fieldCapabilities = [];
};

const privateAddField = (): void => {
  editingFieldIndex.value = undefined;
  fieldDialogRef.value?.show();
};

const privateEditField = (index: number): void => {
  editingFieldIndex.value = index;
  const field = draft.fieldCapabilities[index];
  fieldDialogRef.value?.show(field, persistedKeys.value.has(field.key));
};
const privateConfirmField = (field: FieldCapability): void => {
  if (editingFieldIndex.value === undefined) draft.fieldCapabilities.push(field);
  else draft.fieldCapabilities.splice(editingFieldIndex.value, 1, field);
  fieldListRef.value?.locate(field.key);
};

const privateRemoveField = (index: number): void => {
  draft.fieldCapabilities.splice(index, 1);
};

const privateRemoveLegacyScopes = (): void => {
  draft.scopeCapabilities = draft.scopeCapabilities.filter(
    (scope) => !departmentScopes.includes(scope),
  );
};

const privateSubmit = (): void => {
  if (legacyDepartmentScopes.value.length) {
    Message.warning("平台应用不支持部门范围，请先移除已有选项");
    return;
  }
  if (!draft.name.trim() || (!editing.value && !draft.code.trim())) {
    Message.warning("请填写资源编码和名称");
    return;
  }
  const fields = draft.fieldCapabilities.map(normalizeResourceField);
  if (
    new Set(fields.map((field) => field.key)).size !== fields.length ||
    fields.some((field) => Object.keys(resourceFieldErrors(field, [], manifest.value)).length)
  ) {
    Message.warning("请检查字段键、展示名、可见性和脱敏参数");
    return;
  }
  loading.value = true;
  const payload: AppResourceDraft = {
    code: draft.code.trim(),
    name: draft.name.trim(),
    scopeCapabilities: draft.scopeCapabilities,
    fieldCapabilities: fields,
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
  PlatformResourceCreateAPI(applicationId.value, payload)
    .then(done)
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show(appId: string, target?: ResourceDetail<AppResourceRecord>) {
    applicationId.value = appId;
    editing.value = target;
    manifest.value = undefined;
    bindingError.value = false;
    bindingRequest++;
    fieldDialogRef.value?.close();
    fieldListRef.value?.reset();
    editingFieldIndex.value = undefined;
    persistedKeys.value = new Set(
      props.submit ? [] : (target?.record.fieldCapabilities.map((field) => field.key) ?? []),
    );
    if (target) {
      draft.code = target.record.code;
      draft.name = target.record.name;
      draft.scopeCapabilities = [...target.record.scopeCapabilities];
      draft.fieldCapabilities = target.record.fieldCapabilities.map(cloneResourceField);
    } else {
      reset();
    }
    visible.value = true;
    privateLoadBindings();
  },
});
</script>

<style lang="postcss">
.in-drawer.in-drawer--pinned.resource-edit-drawer .in-drawer__body {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.in-drawer.in-drawer--pinned.resource-edit-drawer .in-drawer__body > .in-loading {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}
</style>

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

.field-cap-item :deep(.el-form-item__content) {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
</style>
