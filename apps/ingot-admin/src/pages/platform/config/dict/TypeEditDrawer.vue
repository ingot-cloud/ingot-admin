<template>
  <in-drawer :title="title" v-model="visible" padding="0">
    <in-form ref="editFormRef" class="form" :model="editForm" :rules="rules" label-width="120px">
      <in-form-group-title title="基础信息" hide-action />
      <div p-20px>
        <el-form-item label="作用域" prop="scopeType">
          <el-radio-group
            v-model="editForm.scopeType"
            :disabled="edit && editForm.systemFlag === true"
            @change="privateOnScopeTypeChange"
          >
            <el-radio-button :value="DictScope.Platform"> 平台 </el-radio-button>
            <el-radio-button :value="DictScope.Tenant"> 租户 </el-radio-button>
            <el-radio-button :value="DictScope.App"> 应用 </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="isTenantScope" label="租户" prop="tenantId">
          <tenant-select
            w-full
            v-model="tenantIdModel"
            :disabled="edit && editForm.systemFlag === true"
          />
        </el-form-item>

        <el-form-item v-if="isAppScope" label="应用" prop="appId">
          <in-page-select
            w-full
            v-model="appIdModel"
            value-field="id"
            label-field="name"
            placeholder="请选择应用"
            :load-data="loadAppData"
            :disabled="edit && editForm.systemFlag === true"
          />
        </el-form-item>

        <el-form-item label="字典编码" prop="code">
          <el-input
            v-model="editForm.code"
            placeholder="请输入字典编码"
            maxlength="64"
            show-word-limit
            clearable
            :disabled="edit && editForm.systemFlag === true"
          />
        </el-form-item>

        <el-form-item label="字典类型名称" prop="name">
          <el-input
            v-model="editForm.name"
            placeholder="请输入字典类型名称"
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
import type { PlatformDict as DictRecord } from "@/models";
import type { DictScope as DictScopeType } from "@/models/enums";
export interface TypeEditDrawerAPI {
  show(payload?: TypeShowPayload): void;
}
/**
 * 字典类型抽屉显示载荷
 * - 不传 / 仅传 scopeContext  -> 新建（按 scopeContext 预填作用域）
 * - 传 record                 -> 编辑
 */
export interface TypeShowPayload {
  record?: DictRecord;
  scopeContext?: {
    scopeType?: DictScopeType;
    tenantId?: string;
    appId?: string;
  };
}
</script>
<script lang="ts" setup>
import type { Page, PlatformDict, ApplicationPageItemVO } from "@/models";
import type { LoadDataParams } from "@/components/select/InPageSelect.vue";
import { CommonStatus, DictType, DictScope } from "@/models/enums";
import { CreateDictAPI, UpdateDictAPI, RemoveDictAPI } from "@/api/platform/config/dict";
import { GetAppPageAPI } from "@/api/platform/config/app";
import { Message } from "@/utils/message";
import { copyParams, getDiff } from "@/utils/object";
import TenantSelect from "@/components/biz/TenantSelect.vue";

const emits = defineEmits(["success"]);

const defaultEditForm: PlatformDict = {
  id: undefined,
  code: undefined,
  name: undefined,
  type: DictType.Type,
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

const isTenantScope = computed(() => editForm.scopeType === DictScope.Tenant);
const isAppScope = computed(() => editForm.scopeType === DictScope.App);

const tenantIdModel = computed<string | undefined>({
  get: () => editForm.tenantId ?? undefined,
  set: (val) => (editForm.tenantId = val ?? undefined),
});
const appIdModel = computed<string | undefined>({
  get: () => editForm.appId ?? undefined,
  set: (val) => (editForm.appId = val ?? undefined),
});

const rules = computed(() => ({
  code: [
    { required: true, message: "字典编码不能为空", trigger: "blur" },
    { max: 64, message: "字典编码长度不能超过 64", trigger: "blur" },
  ],
  name: [
    { required: true, message: "名称不能为空", trigger: "blur" },
    { max: 128, message: "名称长度不能超过 128", trigger: "blur" },
  ],
  scopeType: [{ required: true, message: "请选择作用域", trigger: "blur" }],
  tenantId: [
    {
      required: isTenantScope.value,
      message: "租户作用域缺少租户ID",
      trigger: "blur",
    },
  ],
  appId: [
    {
      required: isAppScope.value,
      message: "应用作用域缺少应用ID",
      trigger: "blur",
    },
  ],
  sort: [{ type: "number", min: 0, message: "排序需为非负整数", trigger: "blur" }],
  remark: [{ max: 255, message: "备注长度不能超过 255", trigger: "blur" }],
}));

const loadAppData = async (params: LoadDataParams): Promise<Page<ApplicationPageItemVO>> => {
  const result = await GetAppPageAPI(
    { current: params.current, size: params.size },
    { name: params.query },
  );
  return result.data;
};

const privateOnScopeTypeChange = (val: string | number | boolean | undefined): void => {
  const scope = val as DictScope;
  if (scope === DictScope.Platform) {
    editForm.tenantId = undefined;
    editForm.appId = undefined;
  } else if (scope === DictScope.Tenant) {
    editForm.appId = undefined;
  } else if (scope === DictScope.App) {
    editForm.tenantId = undefined;
  }
  nextTick(() => {
    unref(editFormRef)?.clearValidate?.(["tenantId", "appId"]);
  });
};

const confirmDelete = useConfirmDelete(transformDeleteAPI(RemoveDictAPI), () => {
  visible.value = false;
  emits("success");
});

const privateOnRemoveClick = (): void => {
  if (!editForm.id) return;
  confirmDelete.exec(editForm.id, `是否删除字典类型(${editForm.name})`, "删除成功");
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

    // 字典类型固定
    editForm.type = DictType.Type;
    editForm.pid = null;
    editForm.value = null;
    editForm.label = null;

    // 作用域非必要字段清理
    if (editForm.scopeType === DictScope.Platform) {
      editForm.tenantId = null;
      editForm.appId = null;
    } else if (editForm.scopeType === DictScope.Tenant) {
      editForm.appId = null;
    } else if (editForm.scopeType === DictScope.App) {
      editForm.tenantId = null;
    }

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
  nextTick(() => {
    unref(editFormRef)?.clearValidate?.();
  });
};

defineExpose<TypeEditDrawerAPI>({
  show(payload?: TypeShowPayload) {
    visible.value = true;
    resetForm();

    const record = payload?.record;
    if (record) {
      copyParams(editForm, record);
      copyParams(rawForm, record);
      title.value = "编辑字典类型";
      edit.value = true;
      if (record.extra && typeof record.extra === "object") {
        extraOptionsFlag.value = true;
        extraJsonText.value = JSON.stringify(record.extra, null, 2);
      }
    } else {
      const ctx = payload?.scopeContext;
      if (ctx?.scopeType) {
        editForm.scopeType = ctx.scopeType;
      }
      if (ctx?.tenantId) {
        editForm.tenantId = ctx.tenantId;
      }
      if (ctx?.appId) {
        editForm.appId = ctx.appId;
      }
      title.value = "新建字典类型";
      edit.value = false;
    }
  },
});
</script>
