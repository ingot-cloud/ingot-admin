<template>
  <in-drawer v-model="visible" title="创建组织" :loading="loading" size="var(--in-drawer-width-detail)">
    <el-steps :active="step" finish-status="success" align-center class="mb-16px">
      <el-step title="组织资料" />
      <el-step title="所有者" />
      <el-step title="开通" />
      <el-step title="预览" />
    </el-steps>

    <in-form v-if="step < 3" label-position="top" :model="draft">
      <el-form-item v-if="step === 0" label="组织名称" required>
        <el-input v-model="draft.name" clearable placeholder="请输入组织名称" />
      </el-form-item>
      <el-form-item v-if="step === 0" label="根部门名称">
        <el-input v-model="draft.rootDepartmentName" clearable placeholder="缺省使用组织名称" />
      </el-form-item>
      <el-form-item v-if="step === 1" label="所有者登录名" required>
        <div class="flex gap-8px">
          <el-input v-model="ownerUsername" clearable placeholder="精确查找已有全局账号" />
          <in-button @click="privateLookupOwner">查找</in-button>
        </div>
      </el-form-item>
      <el-form-item v-if="step === 1 && draft.ownerAccountId" label="所有者账号 ID">
        <span>{{ draft.ownerAccountId }}</span>
      </el-form-item>
      <el-form-item v-if="step === 1" label="所有者显示名">
        <el-input v-model="draft.ownerDisplayName" clearable placeholder="可空，由服务生成" />
      </el-form-item>
      <el-form-item v-if="step === 2" label="开通套餐">
        <in-page-select
          v-model="planPick"
          filterable
          remote
          clearable
          value-field="id"
          label-field="name"
          placeholder="不选则开通基础应用"
          :load-data="loadPlans"
        />
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          不选套餐时开通租户域基础应用；指定套餐后改为该套餐内启用的租户应用。开通不等于业务授权。
        </div>
      </el-form-item>
    </in-form>

    <div v-else class="flex flex-col gap-12px">
      <biz-iam-preview-alert :preview="preview" />
      <div v-if="preview?.effectiveResult">
        <div>组织：{{ preview.effectiveResult.name }}</div>
        <div>所有者账号：{{ preview.effectiveResult.ownerAccountId }}</div>
        <div>根部门：{{ preview.effectiveResult.rootDepartmentName }}</div>
        <div>
          将开通应用：
          {{ preview.effectiveResult.applications.map((item) => item.name).join("、") || "基础应用" }}
        </div>
      </div>
    </div>

    <template #footer>
      <in-button v-if="step > 0" @click="privateBack">上一步</in-button>
      <in-button v-if="step < 3" type="primary" @click="privateNext">下一步</in-button>
      <in-button v-else type="primary" :loading="loading" :disabled="!preview?.valid" @click="privateSubmit">
        提交创建
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import { BizIamPreviewAlert, AccountLookupPurpose, createIamListLoader, toIamSelectRecords, type Preview, type TenantCreateInput, type TenantPreviewResult } from "@ingot/admin-common";
import { PlatformAccountLookupAPI } from "@/api/iam/accounts";
import { PlatformPlanPageAPI } from "@/api/iam/catalog";
import { PlatformTenantCreateAPI, PlatformTenantPreviewAPI } from "@/api/iam/tenants";
import { platformTenantQueryKeys } from "@/api/iam/tenants.query";
import { useQueryClient } from "@tanstack/vue-query";

defineOptions({ name: "CreateWizard" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const visible = ref(false);
const loading = ref(false);
const step = ref(0);
const ownerUsername = ref("");
const preview = ref<Preview<TenantPreviewResult> | null>(null);
const draft = reactive<TenantCreateInput>({
  name: "",
  ownerAccountId: "",
  ownerDisplayName: "",
  rootDepartmentName: "",
  planId: "",
});

const loadPlans = createIamListLoader(async (page, condition) => {
  const response = await PlatformPlanPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const planPick = computed({
  get: () => draft.planId ?? "",
  set: (value: string) => {
    draft.planId = value || undefined;
  },
});

watch(draft, () => {
  preview.value = null;
}, { deep: true });

const reset = (): void => {
  step.value = 0;
  preview.value = null;
  draft.name = "";
  draft.ownerAccountId = "";
  draft.ownerDisplayName = "";
  draft.rootDepartmentName = "";
  draft.planId = "";
  ownerUsername.value = "";
};

const privateLookupOwner = (): void => {
  if (!ownerUsername.value.trim()) {
    Message.warning("请输入所有者登录名");
    return;
  }
  loading.value = true;
  PlatformAccountLookupAPI({
    purpose: AccountLookupPurpose.MEMBER_CREATE,
    username: ownerUsername.value.trim(),
  })
    .then((response) => {
      draft.ownerAccountId = response.data.record.id;
      Message.success("已定位账号，不展示其是否属于其他组织");
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateBack = (): void => {
  step.value -= 1;
  preview.value = null;
};

const privateNext = (): void => {
  if (step.value === 0 && !draft.name.trim()) {
    Message.warning("请输入组织名称");
    return;
  }
  if (step.value === 1 && !draft.ownerAccountId.trim()) {
    Message.warning("请先查找所有者账号");
    return;
  }
  if (step.value === 2) {
    loading.value = true;
    const payload: TenantCreateInput = {
      name: draft.name.trim(),
      ownerAccountId: draft.ownerAccountId.trim(),
      ownerDisplayName: draft.ownerDisplayName || undefined,
      rootDepartmentName: draft.rootDepartmentName || undefined,
      planId: draft.planId || undefined,
    };
    PlatformTenantPreviewAPI(payload)
      .then((response) => {
        preview.value = response.data;
        step.value = 3;
      })
      .finally(() => {
        loading.value = false;
      });
    return;
  }
  step.value += 1;
};

const privateSubmit = (): void => {
  if (!preview.value?.valid) {
    return;
  }
  loading.value = true;
  const payload: TenantCreateInput = {
    name: draft.name.trim(),
    ownerAccountId: draft.ownerAccountId.trim(),
    ownerDisplayName: draft.ownerDisplayName || undefined,
    rootDepartmentName: draft.rootDepartmentName || undefined,
    planId: draft.planId || undefined,
  };
  PlatformTenantCreateAPI(payload)
    .then(() => {
      Message.success("创建成功");
      void queryClient.invalidateQueries({ queryKey: platformTenantQueryKeys.lists() });
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
