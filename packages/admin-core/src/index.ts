import "uno.css";
import "virtual:svg-icons-register";
import "./styles";

/** 设备指纹图片下载等通用工具（来自 `@ingot/shared`） */
export { saveImg, saveSvg } from "@ingot/shared";

export * from "./bootstrap";
export * from "./config";
export * from "./corePlugin";
export * from "./plugin";
export { getAdminRuntimeConfig, getAdminRouter, resetAdminRuntime } from "./runtime";
export { mergeMenuTrees, defineStaticMenus } from "./router/helper/menus";
export {
  Http,
  request,
  defineRequestInterceptor,
  defineResponseInterceptor,
  AdminNetInterceptorOrder,
} from "./net";
export type { RequestOptions, HttpRequestConfig, PreFilter, PostFilter } from "./net";
export { ApiError, isApiError } from "@ingot/http-client";
export * from "./router";
export * from "./models";
export * from "./models/enums";
export * from "./utils";
export * from "./utils/message";
export * from "./utils/object";
export * from "./hooks/biz/useEnum";
export * from "./hooks/biz/useGlobalLoading";
export * from "./hooks/biz/useLogin";
export * from "./query";
export * from "./hooks/web/useMessage";
export * from "./hooks/web/useRouter";
export * from "./hooks/web/useTitle";
export * from "./components/table";
export type {
  InDensity,
  InSurfaceVariant,
  InNavigationMode,
  InTableFeedback,
  InDialogTone,
  InPageScrollMode,
  InPageSurface,
  InTableActionKind,
  InTableActionOverflow,
  InTableAction,
  InTableActionConfirm,
  InAppBarUtilityAction,
} from "./components/types";
export type { LoadDataParams } from "./components/select/InPageSelect.vue";
export { coreGlobalComponents } from "./components/coreComponents";
export { default as InAvatar } from "./components/avatar/InAvatar.vue";
export { default as InCommonStatusTag } from "./components/status/InCommonStatusTag.vue";
export { resolveCommonStatus } from "./components/status/resolveCommonStatus";
export type {
  DisableAccountAPI,
  EnableAccountAPI,
  LockAccountAPI,
  UnlockAccountAPI,
} from "./components/user/types";
export {
  CorrectLevel,
  LineOptionsType,
  OptionsPosType,
  QrcodeType,
  RoundOptionsType,
  useCorrectLevelEnum,
  useLineOptionsTypeEnum,
  useOptionsPosTypeEnum,
  useQrcodeTypeEnum,
  useRoundOptionsTypeEnum,
} from "./components/qrcode/exported";
export * from "./constants/role";
export * from "./net/status-code";
export * from "./layouts";
export * from "./stores/modules/app";
export * from "./stores/modules/auth";
export * from "./stores/modules/router";
export * from "./stores/modules/tabs";
