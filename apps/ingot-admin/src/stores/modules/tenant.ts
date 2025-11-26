import type { Page, CreateOrgDTO, SysTenant, R, MetaApp } from "@/models";
import {
  TenantSearchAPI,
  TenantPageAPI,
  TenantCreateAPI,
  TenantUpdateAPI,
  TenantRemoveAPI,
  TenantInfoAPI,
  TenantOrgApps,
} from "@/api/platform/org/tenant";

export const useTenantStore = defineStore("tenant", () => {
  const needUpdate = ref(false);

  /**
   * 修改更新标识
   */
  const changeUpdateFlag = (flag: boolean) => {
    needUpdate.value = flag;
  };

  const fetchTenantPage = (page: Page, condition?: SysTenant) => {
    return new Promise<R<Page<SysTenant>>>((resolve, reject) => {
      TenantPageAPI(page, condition)
        .then((response) => {
          resolve(response);
        })
        .catch((e) => {
          reject(e);
        });
    });
  };

  const createTenant = (params: CreateOrgDTO) => {
    return new Promise<void>((resolve, reject) => {
      TenantCreateAPI(params)
        .then(() => {
          needUpdate.value = true;
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };

  const updateTenant = (params: SysTenant) => {
    return new Promise<void>((resolve, reject) => {
      TenantUpdateAPI(params)
        .then(() => {
          needUpdate.value = true;
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };

  const removeTenant = (id: string) => {
    return new Promise<void>((resolve, reject) => {
      TenantRemoveAPI(id)
        .then(() => {
          needUpdate.value = true;
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };

  const search = (name?: string) => {
    return new Promise<Array<SysTenant>>((resolve, reject) => {
      TenantSearchAPI(name)
        .then((response) => {
          resolve(response.data);
        })
        .catch(() => {
          reject();
        });
    });
  };

  const info = (id: string) => {
    return new Promise<SysTenant>((resolve, reject) => {
      TenantInfoAPI(id)
        .then((response) => {
          resolve(response.data);
        })
        .catch(() => {
          reject();
        });
    });
  };

  const fetchTenantOrgApps = () => {
    return new Promise<Array<MetaApp>>((resolve, reject) => {
      TenantOrgApps()
        .then((response) => {
          resolve(response.data);
        })
        .catch(() => {
          reject();
        });
    });
  };

  return {
    needUpdate,
    changeUpdateFlag,
    fetchTenantPage,
    createTenant,
    updateTenant,
    removeTenant,
    search,
    info,
    fetchTenantOrgApps,
  };
});
