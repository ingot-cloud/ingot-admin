import request from "@/net";
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
import { filterParams } from "@/utils/object";

const PATH = "/api/pms/v1/platform/config/dict";

/**
 * 字典树（左侧导航）
 * @param query 查询条件，缺省作用域按平台 (scopeType='0')
 */
export function GetDictTreeAPI(query?: DictQueryDTO): Promise<R<Array<DictTreeNodeVO>>> {
  if (query) {
    filterParams(query);
  }
  return request.get<Array<DictTreeNodeVO>>(`${PATH}/tree`, query);
}

/**
 * 管理端分页（数据完整字段，含 extra 与审计字段）
 * @param page 分页参数
 * @param condition 查询条件
 */
export function GetDictPageAPI(
  page: Page,
  condition?: DictQueryDTO,
): Promise<R<Page<PlatformDict>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<PlatformDict>>(`${PATH}/page`, {
    ...page,
    ...condition,
  });
}

/**
 * 取某个字典编码下的"启用项"列表（用于表单下拉、回填等场景）
 * @param code 字典编码
 * @param query 作用域 / 租户 / 应用
 */
export function GetDictItemsAPI(
  code: string,
  query?: DictQueryDTO,
): Promise<R<Array<DictItemVO>>> {
  if (query) {
    filterParams(query);
  }
  return request.get<Array<DictItemVO>>(`${PATH}/items/${code}`, query);
}

/**
 * 新建字典节点（TYPE 或 ITEM）
 */
export function CreateDictAPI(params: DictCreateDTO): Promise<R<void>> {
  filterParams(params);
  return request.post<void>(`${PATH}`, params);
}

/**
 * 更新字典节点（必须带 id）
 */
export function UpdateDictAPI(params: DictUpdateDTO): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params);
}

/**
 * 启用 / 禁用单个字典节点
 * @param id 字典 ID
 * @param status "0" 启用 / "9" 禁用
 */
export function ChangeDictStatusAPI(id: string, status: CommonStatus): Promise<R<void>> {
  return request.patch<void>(`${PATH}/${id}/status/${status}`);
}

/**
 * 批量更新排序（用于拖拽排序后一次提交）
 */
export function SortDictAPI(items: Array<DictSortDTO>): Promise<R<void>> {
  return request.put<void>(`${PATH}/sort`, items);
}

/**
 * 删除字典节点
 */
export function RemoveDictAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}
