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
          placeholder="与路径规则二选一，登录建议 login-auth"
        />
        <div v-if="hasInlinePattern" class="field-tip">已配置路径规则，请先清空后再关联分组</div>
      </el-form-item>
      <el-form-item v-if="hasGroupScope" label="路径规则">
        <div class="field-tip">已关联分组，将使用分组内的路径规则</div>
      </el-form-item>
      <el-form-item v-else label="路径规则" prop="patternList">
        <PatternListEditor v-model="patternListModel" prop-prefix="patternList" />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="触发方式" prop="trigger">
            <in-select
              v-model="editForm.trigger"
              :options="challengeTriggerEnum.getOptions()"
              placeholder="请选择触发方式"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="挑战类型" prop="challengeType">
            <in-select
              v-model="editForm.challengeType"
              :options="challengeTypeEnum.getOptions()"
              placeholder="请选择挑战类型"
            />
            <div class="field-tip">SLIDER / IMAGE 均走 /vc/image 滑块引擎</div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="scope" prop="scope">
        <el-input
          v-model="editForm.scope"
          maxlength="64"
          show-word-limit
          clearable
          placeholder="PassToken 命名空间，登录建议 login"
        />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="PassToken TTL(秒)" prop="passTokenTtlSec">
            <el-input-number v-model="editForm.passTokenTtlSec" :min="1" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="剩余次数" prop="passTokenRemaining">
            <el-input-number v-model="editForm.passTokenRemaining" :min="1" class="w-full" />
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
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="验码失败上限">
            <el-input-number v-model="editForm.challengeFailureLimit" :min="0" class="w-full" />
            <div class="field-tip">网关当前不执行验码失败拉黑</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="拉黑时长(秒)">
            <el-input-number v-model="editForm.blockTtlSec" :min="0" class="w-full" />
            <div class="field-tip">网关当前不执行验码失败拉黑</div>
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
import type { GatewayChallengePolicy, GatewayEndpointGroup, GatewayEndpointPattern } from "@/models";
import {
  ChallengeTriggerEnum,
  ChallengeTypeEnum,
  HttpMethodEnum,
  useChallengeTriggerEnum,
  useChallengeTypeEnum,
} from "@/models/enums";
import { copyParams } from "@/utils/object";
import {
  CreateChallengePolicyAPI,
  DeleteChallengePolicyAPI,
  UpdateChallengePolicyAPI,
} from "@/api/platform/security/policy";
import PatternListEditor from "./PatternListEditor.vue";

const CODE_PATTERN = /^[a-zA-Z0-9-]+$/;
const POLICY_EFFECT_MESSAGE = "规则将在数秒内生效";

const isForbiddenCaptchaPath = (path?: string): boolean => {
  const normalized = path?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return false;
  }
  return normalized === "/vc" || normalized.startsWith("/vc/");
};

const props = defineProps<{
  groups: Array<GatewayEndpointGroup>;
}>();

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

const editFormRef = ref();
const editForm = reactive<GatewayChallengePolicy>(Object.assign({}, defaultEditForm));
const loading = ref(false);
const title = ref("");
const edit = ref(false);
const visible = ref(false);

const message = useMessage();
const confirmDelete = useConfirmDelete(transformDeleteAPI(DeleteChallengePolicyAPI), () => {
  visible.value = false;
  emits("success");
});

const groupOptions = computed(() =>
  props.groups
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

const privateOnRemoveClick = (): void => {
  if (!editForm.id) {
    return;
  }
  confirmDelete.exec(editForm.id, `是否删除挑战策略(${editForm.code})`, "删除成功");
};

const privateOnConfirmClick = (): void => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
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
      title.value = "编辑挑战策略";
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

    title.value = "新建挑战策略";
    edit.value = false;
  },
});
</script>

<style lang="postcss" scoped>
.field-tip {
  @apply mt-6px text-13px text-[var(--in-text-color-secondary)];
}
</style>
