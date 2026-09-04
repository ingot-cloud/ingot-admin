/**
 * 分页与确认框兼容层。
 *
 * @deprecated 新页面使用 `useServerPaging()` 与确认框/Mutation。
 * 含手机号搜索的用户列表仍使用 `usePaging`（敏感参数不得进入 Query Key）。
 * 其余业务调用清零后，由后续版本化 change 删除本文件公共导出，本次不直接移除。
 */
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
export type RecordId = string | number;

export type DeleteRecordAPI<Id extends RecordId = string> = (id: Id) => Promise<R<void>>;

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
export type DeleteRecordFn<Id extends RecordId = string> = (id: Id) => Promise<void>;

/**
 * 更新记录方法
 */
export type UpdateRecordFn<T> = (record: T) => Promise<void>;

/**
 * 操作回调
 */
export type ActionCallbackFn = (params?: PageChangeParams) => void;

/**
 * @deprecated 新页面使用 `useServerPaging()`，本函数在调用清零前保留。后续版本化 change 删除。
 */
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

/**
 * @deprecated 配合 `useConfirmDelete` 使用；新页面直接调用删除 API。后续版本化 change 删除。
 */
export const transformDeleteAPI = <Id extends RecordId>(
  api: DeleteRecordAPI<Id>,
): DeleteRecordFn<Id> => {
  return (id: Id) => {
    return new Promise((resolve, reject) => {
      api(id)
        .then(() => {
          resolve();
        })
        .catch((reason) => reject(reason));
    });
  };
};

/**
 * @deprecated 配合 `useConfirmStatus` 使用；新页面直接调用更新 API。后续版本化 change 删除。
 */
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
 *
 * @deprecated 新页面使用 `useServerPaging()`。含手机号搜索的用户列表仍使用本 Hook；其余调用清零后由后续版本化 change 删除。
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
 *
 * @deprecated 新页面使用确认框 + 写操作 API / Mutation。后续版本化 change 删除。
 */
export const useConfirmDelete = <Id extends RecordId>(
  deleteRecord: DeleteRecordFn<Id>,
  callback?: ActionCallbackFn,
) => {
  const exec = (id: Id, message: string, successMessage?: string) => {
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
 *
 * @deprecated 新页面使用确认框 + 写操作 API / Mutation。后续版本化 change 删除。
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
 *
 * @deprecated 新页面使用确认框 + 写操作 API / Mutation。后续版本化 change 删除。
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

/**
 * 确认修改状态（字符串枚举）
 *
 * @deprecated 新页面使用确认框 + 写操作 API / Mutation。后续版本化 change 删除。
 */
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
