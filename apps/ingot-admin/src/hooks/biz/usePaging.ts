import type { R, Page, PageChangeParams, EnumObj } from "@/models";
import type { CommonStatus } from "@/models/enums";
import { getCommonStatusActionDesc, getCommonStatusToggle } from "@/models/enums";
import { Confirm, Message } from "@/utils/message";

/**
 * 分页接口
 */
export type FetchPageAPI<T, C> = (page: Page, condition?: C) => Promise<R<Page<T>>>;

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
export type FetchPageFn<T, C> = (page: Page, condition?: C) => Promise<Page<T>>;

/**
 * 删除记录方法
 */
export type DeleteRecordFn = (id: string) => Promise<void>;

/**
 * 更新记录方法
 */
export type UpdateRecordFn<T> = (record: T) => Promise<void>;

/**
 * 操作回调
 */
export type ActionCallbackFn = (params?: PageChangeParams) => void;

export const transformPageAPI = <T, C>(api: FetchPageAPI<T, C>): FetchPageFn<T, C> => {
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

export const transformDeleteAPI = (api: DeleteRecordAPI): DeleteRecordFn => {
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

export const transformUpdateAPI = <T>(api: UpdateRecordAPI<T>): UpdateRecordFn<T> => {
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
export const usePaging = <Record, Condition>(fetchPageFn: FetchPageFn<Record, Condition>) => {
  const loading = ref<boolean>(false);
  const condition = reactive({}) as Condition;
  const pageInfo = reactive<Page<Record>>({
    current: 1,
    size: 20,
    total: 0,
    records: [],
  }) as Page<Record>;

  const exec = (params?: PageChangeParams) => {
    if (params) {
      pageInfo[params.type] = params.value;
    }
    const pageParams = toRaw(pageInfo);
    pageParams.total = undefined;
    pageParams.records = undefined;
    loading.value = true;
    return new Promise((resolve, reject) => {
      fetchPageFn(pageParams, condition)
        .then((result) => {
          loading.value = false;
          pageInfo.records = result.records;
          pageInfo.total = Number(result.total);
          resolve(result);
        })
        .catch(() => {
          loading.value = false;
          reject();
        });
    });
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
export const useConfirmDelete = (deleteRecord: DeleteRecordFn, callback?: ActionCallbackFn) => {
  const exec = (id: string, message: string, successMessage?: string) => {
    Confirm.warning(message).then(() => {
      deleteRecord(id).then(() => {
        if (callback) {
          callback();
        }
        if (successMessage) {
          Message.success(successMessage);
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
  updateRecord: UpdateRecordFn<Record>,
  callback?: ActionCallbackFn,
) => {
  const exec = (params: Record, message: string, successMessage?: string) => {
    Confirm.warning(message).then(() => {
      updateRecord(params).then(() => {
        if (callback) {
          callback();
        }
        if (successMessage) {
          Message.success(successMessage);
        }
      });
    });
  };

  return {
    exec,
  };
};

export interface StatusRecord<T> {
  id: string;
  status: T;
}

/**
 * 确认修改状态
 */
export const useConfirmStatus = (
  updateRecord: UpdateRecordFn<StatusRecord<CommonStatus>>,
  callback?: ActionCallbackFn,
) => {
  const exec = (
    id: string,
    status: CommonStatus,
    opsTragetText: string,
    successMessage?: string,
  ) => {
    Confirm.warning(
      `是否${getCommonStatusActionDesc(getCommonStatusToggle(status))}${opsTragetText}`,
    ).then(() => {
      updateRecord({ id, status: getCommonStatusToggle(status) }).then(() => {
        if (callback) {
          callback();
        }
        if (successMessage) {
          Message.success(successMessage);
        }
      });
    });
  };

  return {
    exec,
  };
};

export const useConfirmStatus2 = (
  updateRecord: UpdateRecordFn<StatusRecord<string>>,
  callback?: ActionCallbackFn,
) => {
  const exec = (
    id: string,
    status: string,
    opsTragetText: string,
    enumObj: EnumObj<string>,
    successMessage?: string,
  ) => {
    const oppositeValue = enumObj.getOpposite(status);
    const oppositeText = enumObj.getTagText(oppositeValue).text;
    Confirm.warning(`是否${oppositeText}${opsTragetText}`).then(() => {
      updateRecord({ id, status: oppositeValue }).then(() => {
        if (callback) {
          callback();
        }
        if (successMessage) {
          Message.success(successMessage);
        }
      });
    });
  };

  return {
    exec,
  };
};
