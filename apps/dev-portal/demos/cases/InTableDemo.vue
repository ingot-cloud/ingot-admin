<template>
  <div>
    <p>完整 <code>InTable</code> 依赖分页查询上下文。本演示展示筛选区约定：<code>#tools-start</code>、下拉用选择器、固定模拟数据。</p>
    <el-table :data="rows">
      <el-table-column prop="name" label="名称" />
      <el-table-column label="状态">
        <template #default="{ row }">
          <InTag :value="row.status" />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import InTag from "../../../../packages/admin-core/src/components/tag/InTag.vue";

const rows = [
  { name: "示例部门", status: { text: "启用", tag: "success" as const } },
  { name: "示例成员", status: { text: "锁定", tag: "danger" as const } },
];
</script>
