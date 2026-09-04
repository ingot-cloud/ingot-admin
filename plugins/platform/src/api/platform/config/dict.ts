import { request, type RequestOptions } from "@ingot/admin-core";
import type {
  R,
  Page,
  PlatformDict,
  DictItemVO,
  DictTreeNodeVO,
  DictQueryDTO,
  DictCreateDTO,
  DictUpdateDTO,
  DictSortDTO,
} from "@/models";
import type { CommonStatus } from "@/models/enums";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/pms/v1/platform/config/dict";

/**
 * 字典树（左侧导航）
 * @param query 查询条件，缺省作用域按平台 (scopeType='0')
 */
export function GetDictTreeAPI(query?: DictQueryDTO, options?: RequestOptions): Promise<R<Array<DictTreeNodeVO>>> {
  if (query) {
    filterParams(query);
  }
  return request.get<Array<DictTreeNodeVO>>(`${PATH}/tree`, query, options);
}

/**
 * 管理端分页（数据完整字段，含 extra 与审计字段）
 * @param page 分页参数
 * @param condition 查询条件
 */
export function GetDictPageAPI(
  page: Page,
  condition?: DictQueryDTO,
  options?: RequestOptions,
): Promise<R<Page<PlatformDict>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<PlatformDict>>(
    `${PATH}/page`,
    {
      ...page,
      ...condition,
    },
    options,
  );
}

/**
 * 取某个字典编码下的"启用项"列表（用于表单下拉、回填等场景）
 * @param code 字典编码
 * @param query 作用域 / 租户 / 应用
 */
export function GetDictItemsAPI(
  code: string,
  query?: DictQueryDTO,
  options?: RequestOptions,
): Promise<R<Array<DictItemVO>>> {
  if (query) {
    filterParams(query);
  }
  return request.get<Array<DictItemVO>>(`${PATH}/items/${code}`, query, options);
}

/**
 * 新建字典节点（TYPE 或 ITEM）
 */
export function CreateDictAPI(params: DictCreateDTO, options?: RequestOptions): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params, options);
}

export function UpdateDictAPI(params: DictUpdateDTO, options?: RequestOptions): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params, options);
}

export function ChangeDictStatusAPI(
  id: string,
  status: CommonStatus,
  options?: RequestOptions,
): Promise<R<void>> {
  return request.patch<void>(`${PATH}/${id}/status/${status}`, undefined, options);
}

export function SortDictAPI(items: Array<DictSortDTO>, options?: RequestOptions): Promise<R<void>> {
  return request.put<void>(`${PATH}/sort`, items, options);
}

export function RemoveDictAPI(id: string, options?: RequestOptions): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`, null, options);
}
