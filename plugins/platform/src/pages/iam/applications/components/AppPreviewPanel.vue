<template>
  <div class="flex flex-col gap-20px max-w-720px">
    <div class="flex flex-col gap-8px">
      <div>编码：{{ profile.code || "-" }}</div>
      <div class="flex items-center gap-8px">
        名称：
        <catalog-icon-preview :value="profile.icon" />
        <span>{{ profile.name || "-" }}</span>
      </div>
      <div>说明：{{ profile.description || "-" }}</div>
      <div>排序：{{ profile.sortOrder }}</div>
      <div v-if="showBaseline">组织默认：{{ profile.baseline ? "是" : "否" }}</div>
    </div>
    <div>
      <div class="mb-8px">资源与操作</div>
      <action-hierarchy :actions="actions" empty-text="未添加操作" />
    </div>
    <div>
      <div class="mb-8px">菜单</div>
      <div class="rounded-4px px-16px py-16px bg-[#f8f9fa] flex flex-col gap-16px">
        <div v-if="!previewRows.length" class="text-12px text-[var(--el-text-color-secondary)]">
          未添加菜单
        </div>
        <div
          v-for="(item, index) in previewRows"
          :key="item.row.record.id"
          class="flex flex-col gap-8px"
          :style="{ paddingLeft: `${item.depth * 24}px` }"
        >
          <div v-if="index > 0 && item.depth === 0" class="h-1px bg-[var(--in-border-color)]" />
          <div class="flex items-center gap-8px">
            <catalog-icon-preview :value="item.row.record.icon" />
            <span>{{ item.row.record.name }}</span>
          </div>
          <div class="text-12px text-[var(--el-text-color-secondary)]">
            {{ kindEnum.getTagText(item.row.record.kind).text }} ·
            {{ accessEnum.getTagText(item.row.record.accessMode).text }}
          </div>
          <action-hierarchy
            v-if="item.row.record.accessMode !== MenuAccessMode.OPEN"
            :actions="actionsOf(item.row.record.actionIds)"
            :framed="false"
            empty-text="未关联操作"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MenuAccessMode, useMenuAccessModeEnum, useMenuKindEnum, type MenuTreeRow } from "@ingot/admin-common";
import { catalogActionsOf, menusToTree, type AppWizardProfile, type DraftMenu, type DraftResource } from "../createWizard";
import ActionHierarchy from "./ActionHierarchy.vue";
import CatalogIconPreview from "./CatalogIconPreview.vue";

defineOptions({ name: "AppPreviewPanel" });

const props = defineProps<{
  profile: AppWizardProfile;
  resources: DraftResource[];
  menus: DraftMenu[];
  showBaseline?: boolean;
}>();

const kindEnum = useMenuKindEnum();
const accessEnum = useMenuAccessModeEnum();
const actions = computed(() => catalogActionsOf(props.profile, props.resources));
const previewRows = computed(() => flattenPreview(menusToTree(props.menus)));
const actionsOf = (ids: string[]) => actions.value.filter((item) => ids.includes(item.id));

const flattenPreview = (rows: MenuTreeRow[], depth = 0): Array<{ row: MenuTreeRow; depth: number }> =>
  rows.flatMap((row) => [{ row, depth }, ...flattenPreview(row.children ?? [], depth + 1)]);
</script>
