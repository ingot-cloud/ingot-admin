<template>
  <in-dialog
    v-model="visible"
    :title="isEditing ? '编辑字段' : '添加字段'"
    width="640px"
    layout="pinned"
    append-to-body
    class="resource-field-dialog"
  >
    <div class="field-dialog__intro">配置资源支持的字段能力，实际权限由角色或策略决定。</div>
    <in-form class="field-dialog-form" label-position="left" label-width="88px">
      <el-form-item label="字段键" required :error="errors.key">
        <el-input
          v-model="draft.key"
          :disabled="keyLocked"
          :placeholder="keyLocked ? '已保存字段键不可修改' : '请输入字段键，如 phone'"
        />
        <div class="field-dialog__hint">
          {{
            keyLocked
              ? "字段键关联后端绑定和权限规则；需要新键时请添加新字段。"
              : "与后端绑定使用的逻辑字段键一致，可与实体属性名不同。"
          }}
        </div>
      </el-form-item>
      <el-form-item label="展示名" required :error="errors.label">
        <el-input v-model="draft.label" placeholder="请输入展示名，如手机号" />
      </el-form-item>
      <el-form-item label="可见性" required :error="errors.visibilities">
        <el-checkbox-group v-model="draft.visibilities" class="field-dialog__flags">
          <el-checkbox
            v-for="item in visibilityOptions"
            :key="item.value"
            :value="item.value"
            :disabled="item.value === FieldVisibility.MASKED && nonText"
          >
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
        <div class="field-dialog__hint">
          {{
            nonText
              ? "后端已将此字段接入为非文本类型，仅支持隐藏和完整展示。"
              : "选择角色或策略可配置的显示方式；脱敏内容由后端处理。"
          }}
        </div>
      </el-form-item>
      <el-form-item
        v-if="draft.visibilities.includes(FieldVisibility.MASKED)"
        label="脱敏规则"
        required
        :error="errors.mask"
      >
        <biz-iam-mask-editor v-model="draft.mask" />
      </el-form-item>
      <el-form-item label="操作能力">
        <div class="field-dialog__flags">
          <el-checkbox v-model="draft.editable">支持编辑</el-checkbox>
          <el-checkbox v-model="draft.filterable">支持筛选</el-checkbox>
        </div>
        <div class="field-dialog__hint">声明支持的操作，后端接入且获得授权后才能使用。</div>
      </el-form-item>
      <el-form-item label="后端接入" class="field-dialog__binding">
        <ResourceFieldBinding
          :field="draft"
          :manifest="manifest"
          :checkable="checkable"
          :failed="bindingError"
        />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" @click="privateConfirm">{{
        isEditing ? "确认" : "添加"
      }}</in-button>
    </template>
  </in-dialog>
</template>
<script setup lang="ts">
import {
  BizIamMaskEditor,
  FieldVisibility,
  MaskKind,
  useFieldVisibilityEnum,
  type FieldCapability,
  type FieldBindingManifest,
} from "@ingot/admin-common";
import ResourceFieldBinding from "./ResourceFieldBinding.vue";
import {
  cloneResourceField,
  isNonTextResourceField,
  normalizeResourceField,
  resourceFieldErrors,
} from "./resourceFields";

defineOptions({ name: "ResourceFieldDialog" });
const props = defineProps<{
  otherKeys: string[];
  manifest?: FieldBindingManifest;
  checkable: boolean;
  bindingError: boolean;
}>();
const emits = defineEmits<{ confirm: [field: FieldCapability] }>();
const visible = ref(false);
const isEditing = ref(false);
const keyLocked = ref(false);
const draft = ref<FieldCapability>({
  key: "",
  label: "",
  visibilities: [FieldVisibility.HIDDEN, FieldVisibility.FULL],
  editable: true,
  filterable: false,
  mask: { kind: MaskKind.ALL },
});
const errors = ref<ReturnType<typeof resourceFieldErrors>>({});
const visibilityOptions = useFieldVisibilityEnum().getOptions();
const nonText = computed(() => isNonTextResourceField(draft.value.key, props.manifest));
watch(
  () => draft.value.visibilities.includes(FieldVisibility.MASKED),
  (masked) => {
    if (masked && !draft.value.mask) draft.value.mask = { kind: MaskKind.ALL };
  },
);
const privateConfirm = (): void => {
  errors.value = resourceFieldErrors(draft.value, props.otherKeys, props.manifest);
  if (Object.keys(errors.value).length) return;
  emits("confirm", normalizeResourceField(draft.value));
  visible.value = false;
};
defineExpose({
  show(field?: FieldCapability, lockKey = false) {
    isEditing.value = Boolean(field);
    keyLocked.value = lockKey;
    draft.value = field
      ? cloneResourceField(field)
      : {
          key: "",
          label: "",
          visibilities: [FieldVisibility.HIDDEN, FieldVisibility.FULL],
          editable: true,
          filterable: false,
        };
    draft.value.mask ??= { kind: MaskKind.ALL };
    errors.value = {};
    visible.value = true;
  },
  close() {
    visible.value = false;
  },
});
</script>
<style lang="postcss" scoped>
.field-dialog-form.in-detail-form :deep(.el-form-item) {
  flex-direction: row;
  align-items: flex-start;
  gap: var(--in-space-3);
  margin-bottom: var(--in-space-4);
}
.field-dialog-form.in-detail-form :deep(.el-form-item__label) {
  flex: none;
  line-height: var(--in-control-height);
}
.field-dialog-form.in-detail-form :deep(.el-form-item__content) {
  line-height: var(--in-line-height-body);
}
.field-dialog-form.in-detail-form :deep(.field-dialog__binding) {
  align-items: center;
}
.field-dialog-form.in-detail-form :deep(.field-dialog__binding .el-form-item__content) {
  min-height: var(--in-control-height);
  justify-content: center;
}
.field-dialog__intro {
  margin-bottom: var(--in-space-5);
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-caption);
}
.field-dialog__hint {
  width: 100%;
  margin-top: var(--in-space-1);
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-caption);
  line-height: var(--in-line-height-body);
}
.field-dialog__flags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--in-space-3);
  & :deep(.el-checkbox) {
    margin-right: 0;
  }
}
</style>
