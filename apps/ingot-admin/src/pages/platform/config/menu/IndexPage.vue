<template>
  <in-filter-container>
    <template #header>
      <in-filter-item>
        <in-with-label title="组织类型">
          <in-select
            style="width: 200px"
            v-model="filter.orgType"
            placeholder="请选择类型"
            :options="orgTypeEnums.getOptions()"
            clearable
          />
        </in-with-label>
        <template #rightActions>
          <in-button
            @click="
              filter.orgType = undefined;
              fetchData();
            "
          >
            重置
          </in-button>
          <in-button type="primary" @in-click="fetchData" :loading="loading"> 搜索 </in-button>
        </template>
      </in-filter-item>
    </template>
    <in-table
      :loading="loading"
      :data="menuData"
      :headers="tableHeaders"
      ref="tableRef"
      @refresh="fetchData"
    >
      <template #title> 菜单管理 </template>
      <template #name="{ item }">
        <in-button text link type="primary" @click="privateGoAppDetail(item)">
          {{ item.name }}
        </in-button>
      </template>
      <template #menuType="{ item }">
        <Icon mr-2 :icon="getMenuTypeIcon(item.menuType)" />
        {{ menuTypeEnums.getTagText(item.menuType).text }}
      </template>
      <template #path="{ item }">
        <in-copy-tag :text="item.path" />
      </template>
      <template #accessMode="{ item }">
        <in-tag-enum :value="item.accessMode" :enumObj="accessModeEnums" />
      </template>
      <template #permissionCode="{ item }">
        <in-copy-tag
          v-if="item.accessMode === AccessModeEnum.Permission"
          :text="item.permissionCode || '-'"
        />
        <el-tag v-else type="success">开放</el-tag>
      </template>
      <template #icon="{ item }">
        <in-icon
          v-if="item.icon"
          :name="item.icon"
          class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
        />
        <span v-else>-</span>
      </template>
      <template #hidden="{ item }">
        <el-tag :type="item.hidden ? 'danger' : 'success'">
          {{ item.hidden ? "是" : "否" }}
        </el-tag>
      </template>
      <template #hideBreadcrumb="{ item }">
        <el-tag :type="item.hideBreadcrumb ? 'danger' : 'success'">
          {{ item.hideBreadcrumb ? "是" : "否" }}
        </el-tag>
      </template>
      <template #isCache="{ item }">
        <el-tag :type="item.isCache ? 'danger' : 'success'">
          {{ item.isCache ? "是" : "否" }}
        </el-tag>
      </template>
      <template #props="{ item }">
        <el-tag :type="item.props ? 'danger' : 'success'">
          {{ item.props ? "是" : "否" }}
        </el-tag>
      </template>
      <template #linkType="{ item }">
        <in-tag-enum :value="item.linkType" :enumObj="menuLinkTypeEnums" />
      </template>
      <template #orgType="{ item }">
        <in-tag-enum :value="item.orgType" :enumObj="orgTypeEnums" />
      </template>
      <template #status="{ item }">
        <common-status-tag :status="item.status" />
      </template>
      <template #actions="{ item }">
        <in-button type="primary" text link @click="privateGoAppDetail(item)">
          <template #icon> <i-ep:edit /> </template>
          编辑
        </in-button>
      </template>
    </in-table>
  </in-filter-container>
</template>
<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import {
  AccessModeEnum,
  getMenuTypeIcon,
  useAccessModeEnum,
  useMenuTypeEnum,
  useOrgTypeEnums,
  useMenuLinkTypeEnum,
} from "@/models/enums";
import { tableHeaders } from "./table";
import type { MenuTreeNode, PlatformMenu } from "@/models";
import { GetMenuTreeAPI } from "@/api/platform/config/menu.ts";
import type { TableAPI } from "@/components/table";

const menuTypeEnums = useMenuTypeEnum();
const orgTypeEnums = useOrgTypeEnums();
const menuLinkTypeEnums = useMenuLinkTypeEnum();
const accessModeEnums = useAccessModeEnum();

const message = useMessage();
const go = useGo();

const tableRef = ref<TableAPI>();
const loading = ref(false);
const menuData = ref<Array<MenuTreeNode>>([]);
const filter = ref<PlatformMenu>({});

const fetchData = (): void => {
  loading.value = true;
  GetMenuTreeAPI(filter.value)
    .then((response) => {
      menuData.value = response.data;
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateGoAppDetail = (item: MenuTreeNode): void => {
  if (!item.appId) {
    message.warning("该菜单缺少关联应用，无法跳转");
    return;
  }
  go({ path: `/platform/config/app/detail/${item.appId}`, query: { tab: "menu" } });
};

onMounted(() => {
  fetchData();
});
</script>
