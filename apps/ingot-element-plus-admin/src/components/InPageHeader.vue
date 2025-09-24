<template>
  <el-page-header>
    <template #content>
      <slot name="title" />
    </template>
    <template #extra>
      <slot name="action" />
    </template>
    <slot />
  </el-page-header>
</template>
