<template>
  <div>
    <in-form-group-title title="基本信息" v-model="editFlag" />
    <div p-20px>
      <in-form ref="FormRef" :model="editForm" :rules="rules" :disabled="!editFlag">
        <el-form-item label="logo">
          <in-common-upload-avatar dir="tenant" v-model="editForm.avatar" />
        </el-form-item>
        <el-form-item label="组织名称" prop="name">
          <el-input v-model="editForm.name" clearable placeholder="请输入组织名称"></el-input>
        </el-form-item>
        <el-form-item label="组织编码" prop="code">
          <el-input
            disabled
            v-model="editForm.code"
            clearable
            placeholder="请输入组织编码"
          ></el-input>
        </el-form-item>
        <el-form-item label="周期" prop="daterange">
          <el-date-picker
            v-model="editForm.daterange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          >
          </el-date-picker>
        </el-form-item>
      </in-form>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { SysTenant } from "@/models";
import { copyParams, copyParamsWithoutKeys } from "@/utils/object";

const defaultEditForm: {
  id?: string;
  name?: string;
  code?: string;
  startAt?: string;
  endAt?: string;
  daterange?: [string, string];
  avatar?: string;
} = {
  id: undefined,
  name: undefined,
  code: undefined,
  startAt: undefined,
  endAt: undefined,
  daterange: ["", ""],
  avatar: undefined,
};

const rules = {
  name: [{ required: true, message: "请输入组织名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入组织编码", trigger: "blur" }],
  daterange: [{ required: false }],
};

const editFlag = ref(false);
const FormRef = ref();
const editForm = reactive(Object.assign({}, defaultEditForm));

defineExpose({
  setData(data: SysTenant) {
    // 重置数据
    copyParams(editForm, defaultEditForm);
    nextTick(() => {
      const form = unref(FormRef);
      form.clearValidate();
    });

    copyParams(editForm, data);
    if (data.startAt && data.endAt) {
      editForm.daterange = [data.startAt, data.endAt];
    }
  },
  getData() {
    return new Promise<SysTenant>((resolve, reject) => {
      if (!editFlag.value) {
        reject();
        return;
      }

      const params: SysTenant = {};
      copyParamsWithoutKeys(params, toRaw(editForm), ["daterange"]);

      if (editForm.daterange && editForm.daterange.length > 1) {
        params.startAt = editForm.daterange[0];
        params.endAt = editForm.daterange[1];
      } else {
        params.startAt = undefined;
        params.endAt = undefined;
      }

      FormRef.value.validate((valid: boolean) => {
        if (valid) {
          editFlag.value = false;
          resolve(params);
        }
      });
    });
  },
});
</script>
<style scoped lang="postcss"></style>
