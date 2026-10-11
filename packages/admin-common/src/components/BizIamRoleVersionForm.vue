<template>
  <in-form label-width="100px">
    <el-form-item label="版本名称">
      <el-input v-model="name" maxlength="128" show-word-limit placeholder="未填写时显示 vN" />
    </el-form-item>
    <el-form-item label="版本备注">
      <el-input
        v-model="remark"
        type="textarea"
        :rows="3"
        maxlength="512"
        show-word-limit
        placeholder="说明本次权限调整的用途"
      />
    </el-form-item>
    <el-form-item v-if="allowApplication" label="发布后应用">
      <el-radio-group v-model="mode" class="flex flex-col items-start! gap-8px">
        <el-radio value="PUBLISH">仅发布</el-radio>
        <el-radio value="SOURCE_REVISIONS" :disabled="!sourceRevisionId"
          >替换编辑来源版本的分配</el-radio
        >
        <el-radio value="ALL">应用到全部关联分配</el-radio>
      </el-radio-group>
      <div class="text-12px text-[var(--el-text-color-secondary)] mt-8px w-full">
        发布并应用会先创建版本及应用预览，确认后才切换分配；未通过预检的分配保持原状。
      </div>
    </el-form-item>
  </in-form>
</template>
<script setup lang="ts">
defineOptions({ name: "BizIamRoleVersionForm" });
defineProps<{ allowApplication?: boolean; sourceRevisionId?: string }>();
const name = defineModel<string>("name", { default: "" });
const remark = defineModel<string>("remark", { default: "" });
const mode = defineModel<"PUBLISH" | "SOURCE_REVISIONS" | "ALL">("mode", { default: "PUBLISH" });
</script>
