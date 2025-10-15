<template>
  <in-filter-container>
    <template #header>
      <in-filter-item>
        <in-with-label title="组织类型">
          <in-select
            style="width: 200px"
            v-model="filter.orgTypeText"
            placeholder="请选择类型"
            :options="orgTypeEnums.getOptions()"
            clearable
          />
        </in-with-label>
        <template #rightActions>
          <in-button
            @click="
              filter.orgTypeText = undefined;
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
      <template #toolbar>
        <in-button type="primary" @click="showEditDialog()"> 添加菜单 </in-button>
      </template>
      <template #name="{ item }">
        <in-button text link @click="showEditDialog(item)">
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
      <template #authorityCode="{ item }">
        <in-copy-tag v-if="item.enableAuthority" :text="item.authorityCode || '-'" />
        <el-tag v-else>未开启</el-tag>
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
        <in-button type="success" text link @click="showEditDialog(item.id)">
          <template #icon>
            <i-carbon:parent-child />
          </template>
          添加子菜单
        </in-button>
        <in-button type="primary" text link @click="showEditDialog(item)">
          <template #icon> <i-ep:edit /> </template>
          编辑
        </in-button>
      </template>
    </in-table>
  </in-filter-container>
  <EditDrawer ref="EditDrawerRef" :selectData="selectData" @success="fetchData" />
</template>
<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import {
  getMenuTypeIcon,
  useMenuTypeEnum,
  useOrgTypeEnums,
  useMenuLinkTypeEnum,
} from "@/models/enums";
import { tableHeaders } from "./table";
import type { MenuTreeNode, SysMenu, MenuFilterDTO } from "@/models";
import { GetMenuTreeAPI } from "@/api/basic/menu";
import EditDrawer from "./EditDrawer.vue";
import type { TableAPI } from "@/components/table";

const menuTypeEnums = useMenuTypeEnum();
const orgTypeEnums = useOrgTypeEnums();
const menuLinkTypeEnums = useMenuLinkTypeEnum();

const EditDrawerRef = ref();
const tableRef = ref<TableAPI>();
const loading = ref(false);
const menuData = ref<Array<MenuTreeNode>>([]);
const expandRowKeys = ref<Array<string>>([]);
const selectData = ref<Array<MenuTreeNode>>([]);
const filter = ref<MenuFilterDTO>({});

const fetchData = () => {
  loading.value = true;
  GetMenuTreeAPI(filter.value)
    .then((response) => {
      loading.value = false;
      const data = response.data;
      menuData.value = data;
      menuData.value.forEach((item) => {
        expandRowKeys.value.push(String(item.id));
      });
      selectData.value = [
        {
          id: "0",
          name: "根菜单",
          children: data,
        },
      ];
    })
    .catch(() => {
      loading.value = false;
    });
};

const showEditDialog = (params?: SysMenu | string) => {
  EditDrawerRef.value?.show(params);
};

onMounted(() => {
  fetchData();
});
</script>
