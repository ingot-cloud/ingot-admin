<template>
  <in-filter-container>
    <template #header>
      <in-filter-item>
        <in-with-label title="组织">
          <tenant-select v-model="filter.tenantId" />
        </in-with-label>
        <in-with-label title="客户端">
          <client-select v-model="filter.clientId" />
        </in-with-label>
        <template #rightActions>
          <in-button
            @click="
              filter.tenantId = undefined;
              filter.clientId = undefined;
            "
          >
            重置
          </in-button>
          <in-button type="primary" @in-click="refreshData" :loading="paging.loading.value">
            搜索
          </in-button>
        </template>
      </in-filter-item>
    </template>
    <in-table
      :loading="loading"
      :data="paging.pageInfo.records"
      :headers="tableHeaders"
      :page="paging.pageInfo"
      preserve-expanded-content
      ref="TableRef"
      @refresh="paging.exec"
      @handleSizeChange="paging.exec"
      @handleCurrentChange="paging.exec"
    >
      <template #title> 在线用户管理 </template>
      <template #expand="{ item }">
        <el-table :data="item.tokens">
          <el-table-column label="Token信息">
            <template #default="{ row }">
              <div flex flex-col gap-2 flex-wrap>
                <in-with-label title="账号:">
                  {{ row.principalName }}
                </in-with-label>
                <in-with-label title="Token ID:">
                  {{ row.jti }}
                </in-with-label>
                <in-with-label title="Token类型:">
                  <in-tag :value="tokenAuthMethodEnum.getTagText(row.authType)" />
                </in-with-label>
                <in-with-label title="颁发时间:">
                  {{ row.issuedAt }}
                </in-with-label>
                <in-with-label title="过期时间:">
                  {{ row.expiresAt }}
                </in-with-label>
                <in-with-label title="IP地址:">
                  {{ row.ipAddress }}
                </in-with-label>
                <in-with-label title="用户代理:">
                  {{ row.userAgent }}
                </in-with-label>
                <in-with-label title="设备类型:">
                  {{ row.deviceType }}
                </in-with-label>
                <in-with-label title="操作系统:">
                  {{ row.os }}
                </in-with-label>
                <in-with-label title="浏览器:">
                  {{ row.browser }}
                </in-with-label>
                <in-with-label title="位置:">
                  {{ row.location }}
                </in-with-label>
              </div>
            </template>
          </el-table-column>

          <el-table-column fixed="right" label="操作" width="100">
            <template #default="{ row }">
              <in-button text link type="danger" @click="handleForceOfflineToken(row)">
                强制下线
              </in-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template #avatar="{ item }">
        <div flex flex-row items-center gap-2>
          <el-image v-if="item.avatar" class="w-30px h-30px" :src="item.avatar" fit="cover" />
          <in-button text link>
            {{ item.nickname }}
          </in-button>
        </div>
      </template>
      <template #actions="{ item }">
        <in-button text link type="danger" @click="handleForceOfflineUser(item)">
          强制下线
        </in-button>
      </template>
    </in-table>
  </in-filter-container>
</template>
<script lang="ts" setup>
import { tableHeaders } from "./table";
import type { UserTokenVO, UserTokenQueryDTO, OnlineToken } from "@/models";
import { useTokenAuthMethodEnum } from "@/models/enums";
import {
  UserTokensAPI,
  RevokeTokenByJtiAPI,
  RevokeTokenByUserAPI,
} from "@/api/platform/auth/token";

const confirm = useMessageConfirm();
const message = useMessage();
const tokenAuthMethodEnum = useTokenAuthMethodEnum();
const filter = ref<UserTokenQueryDTO>({});
const loading = ref(false);

const paging = usePaging(transformPageAPI(UserTokensAPI));
const refreshData = () => {
  paging.condition.tenantId = filter.value.tenantId;
  paging.condition.clientId = filter.value.clientId;
  paging.exec();
};

const handleForceOfflineToken = (params: OnlineToken): void => {
  confirm.warning(`是否强制下线Token(${params.jti})?`).then(() => {
    RevokeTokenByJtiAPI(params.jti!).then(() => {
      message.success("操作成功");
      paging.exec();
    });
  });
};

const handleForceOfflineUser = (params: UserTokenVO): void => {
  confirm.warning(`是否强制下线用户(${params.nickname})?`).then(() => {
    RevokeTokenByUserAPI({
      userId: params.userId,
      clientId: filter.value.clientId,
      tenantId: filter.value.tenantId,
    }).then(() => {
      message.success("操作成功");
      paging.exec();
    });
  });
};

watchEffect(() => {
  if (filter.value.tenantId && filter.value.clientId) {
    refreshData();
  }
});
</script>
