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
          placeholder="与路径规则二选一，登录建议 login-auth"
        />
        <div v-if="hasInlinePattern" class="field-tip">已配置路径规则，请先清空后再关联分组</div>
      </in-detail-field>
      <in-detail-field v-if="hasGroupScope" label="路径规则" value="使用关联分组内的路径规则" />
      <in-detail-field v-else label="路径规则" prop="patternList" :value="editForm.patternList">
        <PatternListEditor v-if="editing" v-model="patternListModel" prop-prefix="patternList" />

        <template #view><PatternListPreview :patterns="editForm.patternList" /></template>
      </in-detail-field>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <in-detail-field
            label="触发方式"
            prop="trigger"
            :value="
              challengeTriggerEnum.getOptions().find((item) => item.value === editForm.trigger)
                ?.label ?? editForm.trigger
            "
          >
            <in-select
              v-if="editing"
              v-model="editForm.trigger"
              :options="challengeTriggerEnum.getOptions()"
              placeholder="请选择触发方式"
            />
          </in-detail-field>
        </el-col>
        <el-col :xs="24" :sm="12">
          <in-detail-field
            label="挑战类型"
            prop="challengeType"
            :value="
              challengeTypeEnum.getOptions().find((item) => item.value === editForm.challengeType)
                ?.label ?? editForm.challengeType
            "
          >
            <in-select
              v-if="editing"
              v-model="editForm.challengeType"
              :options="challengeTypeEnum.getOptions()"
              placeholder="请选择挑战类型"
            />
            <div class="field-tip">SLIDER / IMAGE 均走 /vc/image 滑块引擎</div>
          </in-detail-field>
        </el-col>
      </el-row>
      <in-detail-field label="scope" prop="scope" :value="editForm.scope">
        <el-input
          v-if="editing"
          v-model="editForm.scope"
          maxlength="64"
          show-word-limit
          clearable
          placeholder="PassToken 命名空间，登录建议 login"
        />
      </in-detail-field>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <in-detail-field
            label="PassToken TTL(秒)"
            prop="passTokenTtlSec"
            :value="editForm.passTokenTtlSec"
          >
            <el-input-number
              v-if="editing"
              v-model="editForm.passTokenTtlSec"
              :min="1"
              class="w-full"
              placeholder="请输入 PassToken 有效秒数"
            />
          </in-detail-field>
        </el-col>
        <el-col :xs="24" :sm="12">
          <in-detail-field
            label="剩余次数"
            prop="passTokenRemaining"
            :value="editForm.passTokenRemaining"
          >
            <el-input-number
              v-if="editing"
              v-model="editForm.passTokenRemaining"
              :min="1"
              class="w-full"
              placeholder="请输入剩余次数"
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
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <in-detail-field label="验码失败上限" :value="editForm.challengeFailureLimit">
            <el-input-number
              v-if="editing"
              v-model="editForm.challengeFailureLimit"
              :min="0"
              class="w-full"
              placeholder="请输入验码失败上限"
            />
            <div class="field-tip">网关当前不执行验码失败拉黑</div>
          </in-detail-field>
        </el-col>
        <el-col :xs="24" :sm="12">
          <in-detail-field label="拉黑时长(秒)" :value="editForm.blockTtlSec">
            <el-input-number
              v-if="editing"
              v-model="editForm.blockTtlSec"
              :min="0"
              class="w-full"
              placeholder="请输入拉黑秒数"
            />
            <div class="field-tip">网关当前不执行验码失败拉黑</div>
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
import type { GatewayChallengePolicy, GatewayEndpointPattern } from "@/models";
import {
  ChallengeTriggerEnum,
  ChallengeTypeEnum,
  HttpMethodEnum,
  useChallengeTriggerEnum,
  useChallengeTypeEnum,
} from "@/models/enums";
import { copyParams } from "@ingot/admin-core";
import { CreateChallengePolicyAPI, UpdateChallengePolicyAPI } from "@/api/security/policy";
import PatternListEditor from "./PatternListEditor.vue";
import PatternListPreview from "./PatternListPreview.vue";

const CODE_PATTERN = /^[a-zA-Z0-9-]+$/;
const POLICY_EFFECT_MESSAGE = "规则将在数秒内生效";

const isForbiddenCaptchaPath = (path?: string): boolean => {
  const normalized = path?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return false;
  }
  return normalized === "/vc" || normalized.startsWith("/vc/");
};

const defaultEditForm: GatewayChallengePolicy = {
  id: undefined,
  code: undefined,
  groupCode: undefined,
  patternList: [{ path: "", method: HttpMethodEnum.POST }],
  trigger: ChallengeTriggerEnum.ALWAYS,
  challengeType: ChallengeTypeEnum.SLIDER,
  scope: "login",
  passTokenTtlSec: 300,
  passTokenRemaining: 3,
  enabled: true,
  priority: 0,
  remark: undefined,
  challengeFailureLimit: undefined,
  blockTtlSec: undefined,
};

const emits = defineEmits<{ success: [] }>();

const challengeTriggerEnum = useChallengeTriggerEnum();
const challengeTypeEnum = useChallengeTypeEnum();

const editFormRef = ref<FormInstance>();
const editForm = reactive<GatewayChallengePolicy>(Object.assign({}, defaultEditForm));
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

const canReadGroups = useActiveSecurityRead(SecurityAction.POLICY_READ, "challenge");
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

const patternListModel = computed({
  get: (): Array<GatewayEndpointPattern> => editForm.patternList ?? [],
  set: (value: Array<GatewayEndpointPattern>) => {
    editForm.patternList = value;
  },
});

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

const validatePatternList = (
  _rule: unknown,
  _value: unknown,
  callback: (error?: Error) => void,
) => {
  if (hasGroupScope.value) {
    callback();
    return;
  }
  const hasPattern = editForm.patternList?.some((item) => item.path?.trim());
  if (!hasPattern) {
    callback(new Error("请关联分组或配置至少一条路径规则"));
    return;
  }
  const forbidden = editForm.patternList?.some((item) => isForbiddenCaptchaPath(item.path));
  if (forbidden) {
    callback(new Error("路径不得匹配验证码接口 /vc"));
    return;
  }
  callback();
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
  trigger: [{ required: true, message: "请选择触发方式", trigger: "change" }],
  challengeType: [{ required: true, message: "请选择挑战类型", trigger: "change" }],
  scope: [
    { required: true, message: "请输入 scope", trigger: "blur" },
    { max: 64, message: "scope 最长 64 个字符", trigger: "blur" },
  ],
  passTokenTtlSec: [
    { required: true, type: "number", min: 1, message: "TTL 必须大于 0", trigger: "change" },
  ],
  passTokenRemaining: [
    { required: true, type: "number", min: 1, message: "剩余次数必须大于 0", trigger: "change" },
  ],
  patternList: [{ validator: validatePatternList, trigger: "change" }],
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
    const payload = Object.assign({}, toRaw(editForm));
    if (payload.groupCode?.trim()) {
      payload.patternList = undefined;
    } else {
      payload.groupCode = undefined;
    }
    if (payload.trigger) {
      payload.trigger = payload.trigger.toLowerCase();
    }
    const request = edit.value
      ? UpdateChallengePolicyAPI(payload)
      : CreateChallengePolicyAPI(payload);

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
  show(data?: GatewayChallengePolicy) {
    visible.value = true;
    copyParams(editForm, defaultEditForm);
    editForm.patternList = [{ path: "", method: HttpMethodEnum.POST }];
    nextTick(() => {
      unref(editFormRef)?.clearValidate();
    });

    if (data) {
      title.value = "挑战策略详情";
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

    title.value = "新建挑战策略";
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
