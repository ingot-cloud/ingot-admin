<template>
  <in-drawer
    :title="title"
    v-model="visible"
    class="security-policy-drawer"
    layout="pinned"
    size="min(640px, 100vw)"
    :before-close="beforeClose"
  >
    <in-form
      class="policy-form"
      :editing="editing"
      ref="editFormRef"
      :model="editForm"
      :rules="rules"
    >
      <in-detail-field label="编码" prop="code" :value="editForm.code">
        <el-input
          v-if="editing"
          v-model="editForm.code"
          :disabled="edit"
          clearable
          placeholder="英文、数字、连字符"
        />
      </in-detail-field>
      <in-detail-field
        label="关联分组"
        :value="
          groupOptions.find((item) => item.value === editForm.groupCode)?.label ??
          editForm.groupCode
        "
      >
        <in-select
          v-if="editing"
          v-model="editForm.groupCode"
          clearable
          :disabled="hasInlinePattern"
          :options="groupOptions"
          placeholder="与路径规则二选一"
        />
        <div v-if="hasInlinePattern" class="field-tip">已配置路径规则，请先清空后再关联分组</div>
      </in-detail-field>
      <in-detail-field v-if="hasGroupScope" label="路径规则" value="使用关联分组内的路径规则" />
      <in-detail-field v-else label="路径规则" prop="patternList" :value="editForm.patternList">
        <PatternListEditor
          v-if="editing"
          v-model="editForm.patternList"
          prop-prefix="patternList"
        />

        <template #view><PatternListPreview :patterns="editForm.patternList" /></template>
      </in-detail-field>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <in-detail-field
            label="限流维度"
            prop="dimension"
            :value="
              rateLimitDimensionEnum.getOptions().find((item) => item.value === editForm.dimension)
                ?.label ?? editForm.dimension
            "
          >
            <in-select
              v-if="editing"
              v-model="editForm.dimension"
              :options="rateLimitDimensionEnum.getOptions()"
              placeholder="请选择限流维度"
            />
          </in-detail-field>
        </el-col>
        <el-col :xs="24" :sm="12">
          <in-detail-field
            label="控制行为"
            prop="controlBehavior"
            :value="
              controlBehaviorEnum
                .getOptions()
                .find((item) => item.value === editForm.controlBehavior)?.label ??
              editForm.controlBehavior
            "
          >
            <in-select
              v-if="editing"
              v-model="editForm.controlBehavior"
              :options="controlBehaviorEnum.getOptions()"
              placeholder="请选择控制行为"
            />
          </in-detail-field>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <in-detail-field label="QPS" prop="qps" :value="editForm.qps">
            <el-input-number
              v-if="editing"
              v-model="editForm.qps"
              :min="1"
              class="w-full"
              placeholder="请输入 QPS"
            />
          </in-detail-field>
        </el-col>
        <el-col :xs="24" :sm="12">
          <in-detail-field label="突发" prop="burst" :value="editForm.burst">
            <el-input-number
              v-if="editing"
              v-model="editForm.burst"
              :min="0"
              class="w-full"
              placeholder="请输入突发"
            />
          </in-detail-field>
        </el-col>
        <el-col :xs="24" :sm="12">
          <in-detail-field label="窗口(秒)" prop="intervalSec" :value="editForm.intervalSec">
            <el-input-number
              v-if="editing"
              v-model="editForm.intervalSec"
              :min="1"
              class="w-full"
              placeholder="请输入窗口秒数"
            />
          </in-detail-field>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <in-detail-field label="优先级" prop="priority" :value="editForm.priority">
            <el-input-number
              v-if="editing"
              v-model="editForm.priority"
              :min="0"
              class="w-full"
              placeholder="请输入优先级"
            />
          </in-detail-field>
        </el-col>
        <el-col :xs="24" :sm="12">
          <in-detail-field label="是否启用" :value="editForm.enabled ? '启用' : '停用'">
            <el-switch
              v-if="editing"
              v-model="editForm.enabled"
              inline-prompt
              active-text="是"
              inactive-text="否"
            />
          </in-detail-field>
        </el-col>
      </el-row>
      <in-detail-field label="备注" :value="editForm.remark">
        <el-input
          v-if="editing"
          v-model="editForm.remark"
          type="textarea"
          :rows="3"
          clearable
          placeholder="请输入备注"
        />
      </in-detail-field>
    </in-form>
    <template #footer>
      <template v-if="editing">
        <in-button :disabled="loading" @click="cancelEdit">取消</in-button>
        <in-button v-if="canWrite" :loading="loading" type="primary" @click="privateOnConfirmClick"
          >保存</in-button
        >
      </template>
      <in-button v-else-if="canWrite" type="primary" @click="enterEdit">编辑</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import type { FormInstance } from "element-plus";
import { useSecurityPolicyDrawer } from "@/hooks/useSecurityPolicyDrawer";
import { useCapabilities } from "@ingot/admin-core";
const { hasAction } = useCapabilities();
import { SecurityAction, useActiveSecurityRead } from "@/hooks/useSecurityTabs";
import { useQuery } from "@tanstack/vue-query";
import { EndpointGroupListQueryOptions } from "@/api/security/policy.query";
import type { GatewayEndpointPattern, GatewayRateLimitRule } from "@/models";
import {
  ControlBehaviorEnum,
  HttpMethodEnum,
  RateLimitDimensionEnum,
  useControlBehaviorEnum,
  useRateLimitDimensionEnum,
} from "@/models/enums";
import { copyParams } from "@ingot/admin-core";
import { CreateRateLimitRuleAPI, UpdateRateLimitRuleAPI } from "@/api/security/policy";
import PatternListEditor from "./PatternListEditor.vue";
import PatternListPreview from "./PatternListPreview.vue";

const CODE_PATTERN = /^[a-zA-Z0-9-]+$/;
const POLICY_EFFECT_MESSAGE = "规则将在数秒内生效";

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

const editFormRef = ref<FormInstance>();
const editForm = reactive<RateLimitRuleForm>(Object.assign({}, defaultEditForm));
const loading = ref(false);
const title = ref("");
const edit = ref(false);
const visible = ref(false);
const canWrite = computed(() =>
  hasAction(edit.value ? SecurityAction.POLICY_UPDATE : SecurityAction.POLICY_CREATE),
);
const { editing, enterEdit, cancelEdit, open, beforeClose } = useSecurityPolicyDrawer({
  form: editForm,
  formRef: editFormRef,
  visible,
  existing: edit,
  canWrite,
  saving: loading,
});

const canReadGroups = useActiveSecurityRead(SecurityAction.POLICY_READ, "rate-limit");
const groupsQuery = useQuery(() => ({
  ...EndpointGroupListQueryOptions(),
  enabled: visible.value && editing.value && canReadGroups.value,
}));

const message = useMessage();

const groupOptions = computed(() =>
  (groupsQuery.data.value ?? [])
    .filter((item) => item.code)
    .map((item) => ({
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

const privateOnConfirmClick = (): void => {
  if (!editing.value || !canWrite.value || loading.value) return;
  if (!hasAction(edit.value ? SecurityAction.POLICY_UPDATE : SecurityAction.POLICY_CREATE)) return;
  const form = unref(editFormRef);
  form?.validate((valid: boolean) => {
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
      .catch(() => {
        /* The request layer displays errors; keep the draft. */
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
      title.value = "限流规则详情";
      edit.value = true;
      open(true);
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
    open(false);
  },
});
</script>

<style lang="postcss" scoped>
.field-tip {
  @apply mt-6px text-13px text-[var(--in-text-color-secondary)];
}
</style>
