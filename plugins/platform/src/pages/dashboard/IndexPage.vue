<template>
  <in-page-frame mode="page">
    <template #header>
      <in-page-header description="查看当前账号状态、角色和常用安全提示。" />
    </template>

    <in-container>
      <div class="dashboard-grid">
        <section class="dashboard-card">
          <h2 class="dashboard-card__title">当前账号</h2>
          <p class="dashboard-card__desc">登录身份与资料完整度</p>
          <dl class="dashboard-card__list">
            <div>
              <dt>名称</dt>
              <dd>{{ getUsername }}</dd>
            </div>
            <div>
              <dt>资料</dt>
              <dd>{{ getUserInfoWhetherExist ? "已完善手机号" : "尚未完善手机号" }}</dd>
            </div>
          </dl>
        </section>

        <section class="dashboard-card">
          <h2 class="dashboard-card__title">角色</h2>
          <p class="dashboard-card__desc">当前会话拥有的角色</p>
          <div v-if="getRoles.length > 0" class="dashboard-card__tags">
            <el-tag v-for="role in getRoles" :key="role">{{ role }}</el-tag>
          </div>
          <p v-else class="dashboard-card__empty">暂无角色</p>
        </section>

        <section class="dashboard-card">
          <h2 class="dashboard-card__title">安全状态</h2>
          <p class="dashboard-card__desc">初始密码与权限摘要</p>
          <dl class="dashboard-card__list">
            <div>
              <dt>密码</dt>
              <dd>{{ getIsInitPwd ? "需要修改初始密码" : "已设置登录密码" }}</dd>
            </div>
          </dl>
          <div v-auth-any="['1', 'role_admin']" class="dashboard-card__tags">
            <el-tag v-for="item in permissions" :key="item" type="info">{{ item }}</el-tag>
          </div>
        </section>
      </div>
    </in-container>
  </in-page-frame>
</template>

<script lang="ts" setup>
import { usePermissions, useUserInfoStore } from "@ingot/admin-core";

const { getUsername, getRoles, getUserInfoWhetherExist, getIsInitPwd } =
  storeToRefs(useUserInfoStore());
const { permissions } = storeToRefs(usePermissions());
</script>

<style lang="postcss" scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--in-space-5);
}

.dashboard-card {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-3);
  min-width: 0;
  padding: var(--in-section-padding);
  border: 1px solid var(--in-border-color);
  background: var(--in-bg-color-surface);
}

.dashboard-card__title {
  margin: 0;
  color: var(--in-text-color);
  font-size: var(--in-font-size-section-title);
  font-weight: var(--in-font-weight-section-title);
  line-height: var(--in-line-height-section-title);
}

.dashboard-card__desc,
.dashboard-card__empty {
  margin: 0;
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
}

.dashboard-card__list {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-3);
  margin: 0;

  & div {
    display: flex;
    flex-direction: column;
    gap: var(--in-space-1);
  }

  & dt {
    color: var(--in-text-color-secondary);
    font-size: var(--in-font-size-caption);
  }

  & dd {
    margin: 0;
    color: var(--in-text-color);
  }
}

.dashboard-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--in-space-2);
}
</style>
