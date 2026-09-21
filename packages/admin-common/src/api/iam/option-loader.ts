import type { LoadDataParams, Page } from "@ingot/admin-core";
import { IAM_DEFAULT_PAGE_SIZE, type SelectionPurpose } from "../../models/iam/constants";

export interface IamOptionQuery {
  keyword?: string;
  purpose: SelectionPurpose;
}

/**
 * 把 InPageSelect 远程分页接到 IAM 列表，并固定带上 purpose，避免退回全员接口。
 */
export function createIamOptionLoader<T>(
  fetchPage: (page: Page, condition: IamOptionQuery) => Promise<{ data: Page<T> }>,
  purpose: SelectionPurpose,
): (params: LoadDataParams) => Promise<Page<T>> {
  return async (params) => {
    const { data } = await fetchPage(
      {
        current: params.current,
        size: params.size ?? IAM_DEFAULT_PAGE_SIZE,
      },
      {
        purpose,
        keyword: params.query,
      },
    );
    return data;
  };
}

export interface IamListOptionQuery {
  name?: string;
}

/** 目录类选择器：按名称远程分页，不伪造 purpose、不截断首 200 条。 */
export function createIamListLoader<T>(
  fetchPage: (page: Page, condition: IamListOptionQuery) => Promise<{ data: Page<T> }>,
): (params: LoadDataParams) => Promise<Page<T>> {
  return async (params) => {
    const { data } = await fetchPage(
      {
        current: params.current,
        size: params.size ?? IAM_DEFAULT_PAGE_SIZE,
      },
      {
        name: params.query,
      },
    );
    return data;
  };
}
