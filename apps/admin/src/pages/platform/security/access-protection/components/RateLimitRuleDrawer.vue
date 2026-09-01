<template>
  <in-drawer :title="title" v-model="visible" size="640px">
    <in-form ref="editFormRef" :model="editForm" :rules="rules">
      <el-form-item label="编码" prop="code">
        <el-input
          v-model="editForm.code"
          :disabled="edit"
          clearable
          placeholder="英文、数字、连字符"
        />
      </el-form-item>
      <el-form-item label="关联分组">
        <in-select
          v-model="editForm.groupCode"
          clearable
          :disabled="hasInlinePattern"
          :options="groupOptions"
          placeholder="与路径规则二选一"
        />
        <div v-if="hasInlinePattern" class="field-tip">已配置路径规则，请先清空后再关联分组</div>
      </el-form-item>
      <el-form-item v-if="hasGroupScope" label="路径规则">
        <div class="field-tip">已关联分组，将使用分组内的路径规则</div>
      </el-form-item>
      <el-form-item v-else label="路径规则" prop="patternList">
        <PatternListEditor v-model="editForm.patternList" prop-prefix="patternList" />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="限流维度" prop="dimension">
            <in-select
              v-model="editForm.dimension"
              :options="rateLimitDimensionEnum.getOptions()"
              placeholder="请选择限流维度"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="控制行为" prop="controlBehavior">
            <in-select
              v-model="editForm.controlBehavior"
              :options="controlBehaviorEnum.getOptions()"
              placeholder="请选择控制行为"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="QPS" prop="qps">
            <el-input-number v-model="editForm.qps" :min="1" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="突发" prop="burst">
            <el-input-number v-model="editForm.burst" :min="0" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="窗口(秒)" prop="intervalSec">
            <el-input-number v-model="editForm.intervalSec" :min="1" class="w-full" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-input-number v-model="editForm.priority" :min="0" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否启用">
            <el-switch
              v-model="editForm.enabled"
              inline-prompt
              active-text="是"
              inactive-text="否"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注">
        <el-input
          v-model="editForm.remark"
          type="textarea"
          :rows="3"
          clearable
          placeholder="请输入备注"
        />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button v-if="edit" type="danger" @click="privateOnRemoveClick"> 删除 </in-button>
      <in-button :loading="loading" type="primary" @click="privateOnConfirmClick"> 确定 </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import type { GatewayEndpointGroup, GatewayEndpointPattern, GatewayRateLimitRule } from "@base/models";
import {
  ControlBehaviorEnum,
  HttpMethodEnum,
  RateLimitDimensionEnum,
  useControlBehaviorEnum,
  useRateLimitDimensionEnum,
} from "@base/models/enums";
import { copyParams } from "@ingot/admin-core";
import {
  CreateRateLimitRuleAPI,
  DeleteRateLimitRuleAPI,
  UpdateRateLimitRuleAPI,
} from "@base/api/platform/security/policy";
import PatternListEditor from "./PatternListEditor.vue";

const CODE_PATTERN = /^[a-zA-Z0-9-]+$/;
const POLICY_EFFECT_MESSAGE = "规则将在数秒内生效";

const props = defineProps<{
  groups: Array<GatewayEndpointGroup>;
}>();

type RateLimitRuleForm = GatewayRateLimitRule & {
  patternList: Array<GatewayEndpointPattern>;
};

const defaultEditForm: RateLimitRuleForm = {
  id: undefined,
  code: undefined,
  groupCode: undefined,
  patternList: [{ path: "", method: HttpMethodEnum.POST }],
  dimension: RateLimitDimensionEnum.IP,
  qps: 100,
  burst: 0,
  intervalSec: 1,
  controlBehavior: ControlBehaviorEnum.FAST_FAIL,
  enabled: true,
  priority: 0,
  remark: undefined,
};

const emits = defineEmits<{ success: [] }>();

const rateLimitDimensionEnum = useRateLimitDimensionEnum();
const controlBehaviorEnum = useControlBehaviorEnum();

const editFormRef = ref();
const editForm = reactive<RateLimitRuleForm>(Object.assign({}, defaultEditForm));
const loading = ref(false);
const title = ref("");
const edit = ref(false);
const visible = ref(false);

const message = useMessage();
const confirmDelete = useConfirmDelete(transformDeleteAPI(DeleteRateLimitRuleAPI), () => {
  visible.value = false;
  emits("success");
});

const groupOptions = computed(() =>
  props.groups
    .filter((item: any) => item.code)
    .map((item: any) => ({
      label: `${item.name} (${item.code})`,
      value: item.code!,
    })),
);

const hasGroupScope = computed(() => Boolean(editForm.groupCode?.trim()));

const hasInlinePattern = computed(
  () => editForm.patternList?.some((item) => item.path?.trim()) ?? false,
);

watch(
  () => editForm.groupCode,
  (groupCode) => {
    if (groupCode) {
      editForm.patternList = [];
      nextTick(() => {
        unref(editFormRef)?.clearValidate("patternList");
      });
      return;
    }
    if (!editForm.patternList?.length) {
      editForm.patternList = [{ path: "", method: HttpMethodEnum.POST }];
    }
  },
);

const validateScope = (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
  if (hasGroupScope.value) {
    callback();
    return;
  }
  const hasPattern = editForm.patternList?.some((item) => item.path?.trim());
  if (hasPattern) {
    callback();
    return;
  }
  callback(new Error("请关联分组或配置至少一条路径规则"));
};

const rules = {
  code: [
    { required: true, message: "请输入编码", trigger: "blur" },
    {
      pattern: CODE_PATTERN,
      message: "编码仅支持英文、数字和连字符",
      trigger: "blur",
    },
  ],
  dimension: [{ required: true, message: "请选择限流维度", trigger: "change" }],
  controlBehavior: [{ required: true, message: "请选择控制行为", trigger: "change" }],
  qps: [{ required: true, type: "number", min: 1, message: "QPS 必须大于 0", trigger: "change" }],
  patternList: [{ validator: validateScope, trigger: "change" }],
};

const privateOnRemoveClick = (): void => {
  if (!editForm.id) {
    return;
  }
  confirmDelete.exec(editForm.id, `是否删除限流规则(${editForm.code})`, "删除成功");
};

const privateOnConfirmClick = (): void => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (!valid) {
      return;
    }

    loading.value = true;
    const payload: GatewayRateLimitRule = Object.assign({}, toRaw(editForm));
    if (payload.groupCode) {
      delete payload.patternList;
    }
    const request = edit.value ? UpdateRateLimitRuleAPI(payload) : CreateRateLimitRuleAPI(payload);

    request
      .then(() => {
        message.success(POLICY_EFFECT_MESSAGE);
        visible.value = false;
        emits("success");
      })
      .finally(() => {
        loading.value = false;
      });
  });
};

defineExpose({
  show(data?: GatewayRateLimitRule) {
    visible.value = true;
    copyParams(editForm, defaultEditForm);
    editForm.patternList = [{ path: "", method: HttpMethodEnum.POST }];
    nextTick(() => {
      unref(editFormRef)?.clearValidate();
    });

    if (data) {
      title.value = "编辑限流规则";
      edit.value = true;
      copyParams(editForm, data);
      if (data.groupCode) {
        editForm.patternList = [];
      } else {
        editForm.patternList = data.patternList?.length
          ? data.patternList.map((item) => ({ ...item }))
          : [{ path: "", method: HttpMethodEnum.POST }];
      }
      return;
    }

    title.value = "新建限流规则";
    edit.value = false;
  },
});
</script>

<style lang="postcss" scoped>
.field-tip {
  @apply mt-6px text-13px text-[var(--in-text-color-secondary)];
}
</style>
