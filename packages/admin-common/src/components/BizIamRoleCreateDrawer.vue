<template>
  <in-drawer v-model="visible" :title="title" :loading="loading" size="720px">
    <in-form label-position="top">
      <el-form-item label="编码" required>
        <el-input v-model="draft.code" placeholder="发布后不可改" />
      </el-form-item>
      <el-form-item label="名称" required>
        <el-input v-model="draft.name" placeholder="请输入角色名称" />
      </el-form-item>
      <el-form-item label="说明">
        <el-input v-model="draft.description" type="textarea" :rows="2" placeholder="请输入说明" />
      </el-form-item>
      <el-form-item label="分组">
        <el-input v-model="draft.groupName" placeholder="请输入分组，可空" />
      </el-form-item>
      <el-form-item v-if="allowDeltas" label="基础版本 ID" required>
        <el-input v-model="draft.baseRevisionId" placeholder="共享角色固定版本" />
      </el-form-item>
      <el-form-item label="操作授权" required>
        <div
          v-if="loadApplications && loadActions"
          class="mb-8px text-12px text-[var(--el-text-color-secondary)]"
        >
          先选择应用，再选择该应用下的操作。共享角色请选带「组织」的应用。
        </div>
        <biz-iam-grant-editor
          v-model="draft.definition"
          :allow-deltas="allowDeltas"
          :load-applications="loadApplications"
          :load-actions="loadActions"
        />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" @in-click="privateSubmit">创建并发布首个版本</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message, type LoadDataParams, type Page, type R } from "@ingot/admin-core";
import BizIamGrantEditor from "./BizIamGrantEditor.vue";
import {
  emptyRoleDefinitionDraft,
  type CreatedResource,
  type IamSelectOption,
  type RoleCreateInput,
  type RoleCreateKind,
  type RoleDefinitionDraft,
} from "../models/iam";

defineOptions({ name: "BizIamRoleCreateDrawer" });

const props = withDefaults(
  defineProps<{
    title?: string;
    kind: RoleCreateKind;
    allowDeltas?: boolean;
    loadApplications?: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    loadActions?: (applicationId: string, params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    createApi: (input: RoleCreateInput) => Promise<R<CreatedResource>>;
  }>(),
  {
    title: "创建角色",
    allowDeltas: false,
  },
);

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const loading = ref(false);
const draft = reactive({
  code: "",
  name: "",
  description: "",
  groupName: "",
  baseRevisionId: "",
  definition: emptyRoleDefinitionDraft() as RoleDefinitionDraft,
});

const reset = (): void => {
  draft.code = "";
  draft.name = "";
  draft.description = "";
  draft.groupName = "";
  draft.baseRevisionId = "";
  draft.definition = emptyRoleDefinitionDraft();
};

const privateSubmit = (): void => {
  if (!draft.code.trim() || !draft.name.trim()) {
    Message.warning("请填写编码和名称");
    return;
  }
  if (props.allowDeltas && !draft.baseRevisionId.trim()) {
    Message.warning("定制角色需要基础版本 ID");
    return;
  }
  if (!props.allowDeltas && !draft.definition.grants.some((item) => item.actionId.trim())) {
    Message.warning("请至少添加一条操作授权");
    return;
  }
  loading.value = true;
  const input: RoleCreateInput = {
    code: draft.code.trim(),
    name: draft.name.trim(),
    description: draft.description.trim() || undefined,
    groupName: draft.groupName.trim() || undefined,
    kind: props.kind,
    baseRevisionId: draft.baseRevisionId.trim() || undefined,
    definition: {
      grants: draft.definition.grants.filter((item) => item.actionId.trim()),
      deltas: draft.definition.deltas.filter((item) => item.actionId.trim()),
      parameterDefinitions: draft.definition.parameterDefinitions.filter((item) => item.key.trim()),
    },
  };
  props
    .createApi(input)
    .then(() => {
      Message.success("已创建并发布首个版本，既有授权不会自动升级");
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show() {
    reset();
    visible.value = true;
  },
});
</script>
