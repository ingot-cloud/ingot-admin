import type { Component } from "vue";
import AccountStatusEditButton from "./biz/user/AccountStatusEditButton.vue";
import AccountStatusView from "./biz/user/AccountStatusView.vue";
import BizDeptSelect from "./biz/dept-select/BizDeptSelect.vue";
import BizSearchUserByPhone from "./biz/search-user-by-phone/BizSearchUserByPhone.vue";
import ClientSelect from "./biz/ClientSelect.vue";
import CommonStatusButton from "./biz/CommonStatusButton.vue";
import CommonStatusTag from "./biz/CommonStatusTag.vue";
import InInputTag from "./biz/InInputTag.vue";
import InStatusButton from "./biz/InStatusButton.vue";
import InTag from "./biz/InTag.vue";
import InTagEnum from "./biz/InTagEnum.vue";
import TenantOptions from "./biz/tenant-options/TenantOptions.vue";
import TenantSelect from "./biz/TenantSelect.vue";

export const adminGlobalComponents: Record<string, Component> = {
  AccountStatusEditButton,
  AccountStatusView,
  BizDeptSelect,
  BizSearchUserByPhone,
  ClientSelect,
  CommonStatusButton,
  CommonStatusTag,
  InInputTag,
  InStatusButton,
  InTag,
  InTagEnum,
  TenantOptions,
  TenantSelect,
};

declare module "vue" {
  export interface GlobalComponents {
    AccountStatusEditButton: typeof AccountStatusEditButton;
    AccountStatusView: typeof AccountStatusView;
    BizDeptSelect: typeof BizDeptSelect;
    BizSearchUserByPhone: typeof BizSearchUserByPhone;
    ClientSelect: typeof ClientSelect;
    CommonStatusButton: typeof CommonStatusButton;
    CommonStatusTag: typeof CommonStatusTag;
    InInputTag: typeof InInputTag;
    InStatusButton: typeof InStatusButton;
    InTag: typeof InTag;
    InTagEnum: typeof InTagEnum;
    TenantOptions: typeof TenantOptions;
    TenantSelect: typeof TenantSelect;
  }
}
