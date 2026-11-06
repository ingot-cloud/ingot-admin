<template>
  <in-detail-drawer
    v-model="open"
    v-model:editing="editing"
    :title="record ? '权限详情' : '添加权限'"
    :tabs="false"
    :editable="canEdit"
    :saving="saving"
    @edit="startEdit"
    @cancel="cancel"
    @save="validate"
  >
    <template v-if="record" #identity>
      <in-detail-identity :name="record.name" :show-avatar="false">
        <template #status><in-common-status-tag :status="record.status" /></template>
        <template #more>
          <in-table-actions :actions="actions" :row="record" />
        </template>
      </in-detail-identity>
    </template>
    <in-form ref="form" :editing="editing" :model="draft" :rules="rules">
      <el-form-item v-if="!record" label="上级权限">
        <el-input v-if="parent" :model-value="parent.name" disabled placeholder="上级权限已指定" />
        <el-tree-select
          v-else
          v-model="draft.pid"
          class="w-full"
          placeholder="请选择上级权限"
          :data="candidates.data.value ?? []"
          :props="TreeKeyAndProps.props"
          node-key="id"
          check-strictly
          clearable
        />
      </el-form-item>
      <in-detail-field label="权限名称" prop="name" :value="record?.name">
        <el-input v-model="draft.name" clearable placeholder="请输入权限名称" />
      </in-detail-field>
      <in-detail-field v-if="record" label="权限编码" :value="record.code" />
      <el-form-item v-else label="权限编码" prop="code">
        <el-input v-model="draft.code" clearable placeholder="请输入权限编码" />
      </el-form-item>
      <in-detail-field label="备注" :value="record?.remark">
        <el-input v-model="draft.remark" type="textarea" placeholder="请输入备注" />
      </in-detail-field>
    </in-form>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import type { MemberPermission, MemberPermissionTreeNodeVO } from "@/models";
import { TreeKeyAndProps } from "@/models";
import { MemberAction } from "@/models/actions";
import {
  CreateAuthorityAPI,
  UpdateAuthorityAPI,
  RemoveAuthorityAPI,
} from "@/api/member/permission";
import { MemberPermissionTreeQueryOptions } from "@/api/member/permission.query";
import { Message, useCapabilities, type InTableAction } from "@ingot/admin-core";
import { useQuery } from "@tanstack/vue-query";

const emit = defineEmits<{ success: [] }>();
const { hasAction } = useCapabilities();
const open = ref(false);
const editing = ref(false);
const saving = ref(false);
const record = ref<MemberPermissionTreeNodeVO>();
const parent = ref<MemberPermissionTreeNodeVO>();
const draft = ref<MemberPermission>({});
const form = ref<{ validate: (handler: (valid: boolean) => void) => void }>();
const rules = {
  name: [{ required: true, message: "请输入权限名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入权限编码", trigger: "blur" }],
};
const canEdit = computed(() =>
  hasAction(record.value ? MemberAction.PERMISSION_UPDATE : MemberAction.PERMISSION_CREATE),
);
const candidates = useQuery(() => ({
  ...MemberPermissionTreeQueryOptions(undefined),
  enabled: open.value && !record.value && !parent.value && hasAction(MemberAction.PERMISSION_QUERY),
}));
const actions: InTableAction<MemberPermissionTreeNodeVO>[] = [
  {
    key: "delete",
    label: "删除权限",
    kind: "danger",
    overflow: "always",
    permission: MemberAction.PERMISSION_DELETE,
    confirm: "确定删除此权限？",
    onSelect: ({ id }) => {
      if (id && hasAction(MemberAction.PERMISSION_DELETE))
        void mutate(() => RemoveAuthorityAPI(id));
    },
  },
];

function startEdit(): void {
  if (record.value && canEdit.value) {
    draft.value = { name: record.value.name, remark: record.value.remark };
    editing.value = true;
  }
}

function cancel(): void {
  editing.value = false;
  if (!record.value) open.value = false;
}

function validate(): void {
  form.value?.validate((valid) => {
    if (!valid || !canEdit.value || !editing.value) return;
    const target = record.value;
    if (target && draft.value.name === target.name && draft.value.remark === target.remark) {
      editing.value = false;
      return;
    }
    void mutate(() =>
      target
        ? UpdateAuthorityAPI({ id: target.id, name: draft.value.name, remark: draft.value.remark })
        : CreateAuthorityAPI({ ...draft.value }),
    );
  });
}

async function mutate(request: () => Promise<unknown>): Promise<void> {
  if (saving.value) return;
  saving.value = true;
  const target = record.value;
  try {
    await request();
    if (record.value === target) {
      editing.value = false;
      open.value = false;
    }
    Message.success("操作成功");
    emit("success");
  } catch {
    // 请求层展示错误，保留当前编辑。
  } finally {
    saving.value = false;
  }
}

defineExpose({
  show(row?: MemberPermissionTreeNodeVO, addChild = false) {
    record.value = addChild ? undefined : row;
    parent.value = addChild ? row : undefined;
    draft.value = { pid: parent.value?.id };
    editing.value = !record.value;
    open.value = true;
  },
});
</script>
