<template>
  <in-drawer :title="title" v-model="visible" padding="0">
    <in-form ref="editFormRef" class="form" :model="editForm" :rules="rules" label-width="120px">
      <in-form-group-title title="所属字典类型" hide-action />
      <div p-20px>
        <el-form-item label="字典类型">
          <el-input :model-value="parentTypeName" disabled />
        </el-form-item>
        <el-form-item label="字典编码">
          <el-input :model-value="editForm.code" disabled />
        </el-form-item>
      </div>

      <in-form-group-title title="基础信息" hide-action />
      <div p-20px>
        <el-form-item label="字典项名称" prop="name">
          <el-input
            v-model="editForm.name"
            placeholder="请输入字典项名称"
            maxlength="128"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-form-item label="字典值" prop="value">
          <el-input
            v-model="editForm.value"
            placeholder="请输入字典值（业务存储值）"
            maxlength="128"
            show-word-limit
            clearable
            :disabled="edit && editForm.systemFlag === true"
          />
        </el-form-item>

        <el-form-item label="展示文本" prop="label">
          <el-input
            v-model="editForm.label"
            placeholder="请输入展示文本（选择器主显字段）"
            maxlength="128"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="editForm.sort" :min="0" controls-position="right" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editForm.status">
            <el-radio-button :value="CommonStatus.Enable"> 启用 </el-radio-button>
            <el-radio-button :value="CommonStatus.Lock"> 禁用 </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="editForm.remark"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入备注"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
      </div>

      <in-form-group-title title="扩展属性 (extra)" v-model="extraOptionsFlag" />
      <div p-20px v-if="extraOptionsFlag">
        <el-form-item label="JSON">
          <el-input
            v-model="extraJsonText"
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 10 }"
            placeholder='例如：{"icon":"ep:user","color":"#52c41a"}'
          />
        </el-form-item>
      </div>
    </in-form>
    <template #footer>
      <in-button
        v-if="edit && editForm.systemFlag !== true"
        type="danger"
        @click="privateOnRemoveClick"
      >
        删除
      </in-button>
      <in-button :loading="loading" type="primary" @click="privateOnConfirmClick"> 确定 </in-button>
    </template>
  </in-drawer>
</template>
<script lang="ts">
import type { PlatformDict as DictRecord, DictTreeNodeVO as DictNode } from "@/models";
export interface ItemEditDrawerAPI {
  show(payload: ItemShowPayload): void;
}
/**
 * 字典项抽屉显示载荷
 * - 必传 currentType（用于锁定 pid / code / 作用域）
 * - 传 record    -> 编辑字典项
 * - 不传 record  -> 新建字典项
 */
export interface ItemShowPayload {
  currentType: DictNode;
  record?: DictRecord;
}
</script>
<script lang="ts" setup>
import type { PlatformDict, DictTreeNodeVO } from "@/models";
import { CommonStatus, DictType, DictScope } from "@/models/enums";
import { CreateDictAPI, UpdateDictAPI, RemoveDictAPI } from "@/api/platform/base/dict";
import { Message } from "@/utils/message";
import { copyParams, getDiff } from "@/utils/object";

const emits = defineEmits(["success"]);

const defaultEditForm: PlatformDict = {
  id: undefined,
  pid: undefined,
  code: undefined,
  name: undefined,
  value: undefined,
  label: undefined,
  type: DictType.Item,
  scopeType: DictScope.Platform,
  tenantId: undefined,
  appId: undefined,
  orgType: undefined,
  sort: 0,
  systemFlag: false,
  status: CommonStatus.Enable,
  remark: undefined,
  extra: undefined,
};

const editFormRef = ref();
const editForm = reactive<PlatformDict>(Object.assign({}, defaultEditForm));
const rawForm: PlatformDict = Object.assign({}, defaultEditForm);

const visible = ref(false);
const loading = ref(false);
const edit = ref(false);
const title = ref("");
const extraOptionsFlag = ref(false);
const extraJsonText = ref("");
const parentTypeName = ref("");
const currentType = ref<DictTreeNodeVO | undefined>();

const rules = {
  name: [
    { required: true, message: "名称不能为空", trigger: "blur" },
    { max: 128, message: "名称长度不能超过 128", trigger: "blur" },
  ],
  value: [
    {
      required: true,
      message: "字典项必须填写 value、label 并指定父字典类型",
      trigger: "blur",
    },
    { max: 128, message: "字典值长度不能超过 128", trigger: "blur" },
  ],
  label: [
    {
      required: true,
      message: "字典项必须填写 value、label 并指定父字典类型",
      trigger: "blur",
    },
    { max: 128, message: "展示文本长度不能超过 128", trigger: "blur" },
  ],
  sort: [{ type: "number", min: 0, message: "排序需为非负整数", trigger: "blur" }],
  remark: [{ max: 255, message: "备注长度不能超过 255", trigger: "blur" }],
};

const confirmDelete = useConfirmDelete(transformDeleteAPI(RemoveDictAPI), () => {
  visible.value = false;
  emits("success");
});

const privateOnRemoveClick = (): void => {
  if (!editForm.id) return;
  confirmDelete.exec(editForm.id, `是否删除字典项(${editForm.label || editForm.name})`, "删除成功");
};

const buildExtra = (): Record<string, unknown> | null | undefined => {
  if (!extraOptionsFlag.value) return undefined;
  const text = extraJsonText.value?.trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    Message.warning("扩展属性 JSON 必须为对象");
    return undefined;
  } catch {
    Message.warning("扩展属性 JSON 解析失败");
    return undefined;
  }
};

const privateOnConfirmClick = (): void => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (!valid) return;

    // 字典项固定字段：type / pid / code / 作用域 沿用父字典类型
    editForm.type = DictType.Item;
    editForm.pid = currentType.value?.id ?? editForm.pid;
    editForm.code = currentType.value?.code ?? editForm.code;
    if (currentType.value?.scopeType) {
      editForm.scopeType = currentType.value.scopeType;
    }
    editForm.tenantId =
      currentType.value?.scopeType === DictScope.Tenant
        ? (currentType.value?.tenantId ?? null)
        : null;
    editForm.appId =
      currentType.value?.scopeType === DictScope.App ? (currentType.value?.appId ?? null) : null;

    if (extraOptionsFlag.value) {
      const extra = buildExtra();
      if (extra === undefined && extraJsonText.value?.trim()) {
        return;
      }
      editForm.extra = extra ?? null;
    }

    let task;
    if (edit.value) {
      const params = getDiff<PlatformDict>(rawForm, toRaw(editForm));
      if (Object.keys(params).length === 0) {
        Message.warning("未改变数据");
        return;
      }
      params.id = rawForm.id;
      task = UpdateDictAPI(params as PlatformDict & { id: string });
    } else {
      task = CreateDictAPI(Object.assign({}, toRaw(editForm)));
    }

    loading.value = true;
    task
      .then(() => {
        loading.value = false;
        Message.success("操作成功");
        visible.value = false;
        emits("success");
      })
      .catch(() => {
        loading.value = false;
      });
  });
};

const resetForm = (): void => {
  copyParams(editForm, defaultEditForm);
  copyParams(rawForm, defaultEditForm);
  extraOptionsFlag.value = false;
  extraJsonText.value = "";
  parentTypeName.value = "";
  nextTick(() => {
    unref(editFormRef)?.clearValidate?.();
  });
};

defineExpose<ItemEditDrawerAPI>({
  show(payload: ItemShowPayload) {
    visible.value = true;
    resetForm();
    currentType.value = payload.currentType;
    parentTypeName.value = payload.currentType.name || payload.currentType.code || "";

    // 父类型上下文沿用至 form
    editForm.type = DictType.Item;
    editForm.pid = payload.currentType.id;
    editForm.code = payload.currentType.code;
    if (payload.currentType.scopeType) {
      editForm.scopeType = payload.currentType.scopeType;
    }
    if (payload.currentType.tenantId) {
      editForm.tenantId = payload.currentType.tenantId;
    }
    if (payload.currentType.appId) {
      editForm.appId = payload.currentType.appId;
    }
    if (payload.currentType.orgType) {
      editForm.orgType = payload.currentType.orgType;
    }

    const record = payload.record;
    if (record) {
      copyParams(editForm, record);
      copyParams(rawForm, record);
      // 父类型可能与 record 中的 code / scopeType 不一致，以父类型为准
      editForm.code = payload.currentType.code;
      title.value = "编辑字典项";
      edit.value = true;
      if (record.extra && typeof record.extra === "object") {
        extraOptionsFlag.value = true;
        extraJsonText.value = JSON.stringify(record.extra, null, 2);
      }
    } else {
      title.value = "新建字典项";
      edit.value = false;
    }
  },
});
</script>
