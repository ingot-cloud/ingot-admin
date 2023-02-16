import type { R, Page, PageChangeParams } from "@/models";
import type { CommonStatus } from "@/models/enums";
import {
  getCommonStatusActionDesc,
  getCommonStatusToggle,
} from "@/models/enums";
import { Confirm, Message } from "@/utils/message";

/**
 * 分页接口
 */
export type FetchPageAPI<T, C> = (
  page: Page,
  condition?: C
) => Promise<R<Page<T>>>;

/**
 * 删除记录接口
 */
export type DeleteRecordAPI = (id: string) => Promise<R<void>>;

/**
 * 更新记录接口
 */
export type UpdateRecordAPI<T> = (record: T) => Promise<R<void>>;

/**
 * 获取分页数据方法
 */
export type FetchPage<T, C> = (page: Page, condition?: C) => Promise<Page<T>>;

/**
 * 删除记录方法
 */
export type DeleteRecord = (id: string) => Promise<void>;

/**
 * 更新记录方法
 */
export type UpdateRecord<T> = (record: T) => Promise<void>;

/**
 * 操作回调
 */
export type ActionCallback = (params?: PageChangeParams) => void;

export const transformPage = <T, C>(
  api: FetchPageAPI<T, C>
): FetchPage<T, C> => {
  return (page: Page, condition?: C) => {
    return new Promise((resolve, reject) => {
      api(page, condition)
        .then((response) => {
          resolve(response.data);
        })
        .catch((reason) => reject(reason));
    });
  };
};

export const transformDelete = (api: DeleteRecordAPI): DeleteRecord => {
  return (id: string) => {
    return new Promise((resolve, reject) => {
      api(id)
        .then(() => {
          resolve();
        })
        .catch((reason) => reject(reason));
    });
  };
};

export const transformUpdate = <T>(
  api: UpdateRecordAPI<T>
): UpdateRecord<T> => {
  return (record: T) => {
    return new Promise((resolve, reject) => {
      api(record)
        .then(() => {
          resolve();
        })
        .catch((reason) => reject(reason));
    });
  };
};

/**
 * 分页
 */
export const usePaging = <Record, Condition>(
  fetchPageAPI: FetchPage<Record, Condition>
) => {
  const loading = ref<boolean>(false);
  const condition = reactive({}) as Condition;
  const pageInfo = reactive<Page<Record>>({
    current: 1,
    size: 20,
    total: 0,
    records: [],
  }) as Page<Record>;

  const exec = (params?: PageChangeParams): void => {
    if (params) {
      pageInfo[params.type] = params.value;
    }
    const pageParams = toRaw(pageInfo);
    pageParams.total = undefined;
    pageParams.records = undefined;
    loading.value = true;
    fetchPageAPI(pageParams, condition)
      .then((result) => {
        loading.value = false;
        pageInfo.records = result.records;
        pageInfo.total = Number(result.total);
      })
      .catch(() => (loading.value = false));
  };

  return {
    loading,
    condition,
    pageInfo,
    exec,
  };
};

/**
 * 确认删除
 */
export const useConfirmDelete = (
  deleteRecord: DeleteRecord,
  callback?: ActionCallback
) => {
  const exec = (id: string, message: string) => {
    Confirm.warning(message).then(() => {
      deleteRecord(id).then(() => {
        Message.success("操作成功");
        if (callback) {
          callback();
        }
      });
    });
  };

  return {
    exec,
  };
};

/**
 * 确认更新
 */
export const useConfirmUpdate = <Record>(
  updateRecord: UpdateRecord<Record>,
  callback?: ActionCallback
) => {
  const exec = (params: Record, message: string) => {
    Confirm.warning(message).then(() => {
      updateRecord(params).then(() => {
        Message.success("操作成功");
        if (callback) {
          callback();
        }
      });
    });
  };

  return {
    exec,
  };
};

export interface StatusRecord {
  id: string;
  status: CommonStatus;
}

/**
 * 确认修改状态
 */
export const useConfirmStatus = (
  updateRecord: UpdateRecord<StatusRecord>,
  callback?: ActionCallback
) => {
  const exec = (id: string, status: CommonStatus, opsTragetText: string) => {
    Confirm.warning(
      `是否${getCommonStatusActionDesc(
        getCommonStatusToggle(status)
      )}${opsTragetText}`
    ).then(() => {
      updateRecord({ id, status: getCommonStatusToggle(status) }).then(() => {
        Message.success("操作成功");
        if (callback) {
          callback();
        }
      });
    });
  };

  return {
    exec,
  };
};
