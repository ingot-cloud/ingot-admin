import type { Component } from "vue";
import InButton from "./button/InButton.vue";
import InButtonDelete from "./button/InButtonDelete.vue";
import InButtonEdit from "./button/InButtonEdit.vue";
import InContainer from "./container/InContainer.vue";
import InFilterContainer from "./container/InFilterContainer.vue";
import InFilterItem from "./container/InFilterItem.vue";
import InCopyTag from "./InCopyTag.vue";
import InDialog from "./InDialog.vue";
import InDrawer from "./drawer/InDrawer.vue";
import InEditor from "./editor/InEditor.vue";
import InForm from "./form/InForm.vue";
import InFormGroupTitle from "./form/InFormGroupTitle.vue";
import InGlobalLoading from "./InGlobalLoading.vue";
import InIcon from "./InIcon.vue";
import InIconCollection from "./InIconCollection.vue";
import InPageHeader from "./InPageHeader.vue";
import InQrcode from "./qrcode/InQrcode.vue";
import InSelect from "./select/InSelect.vue";
import InPageSelect from "./select/InPageSelect.vue";
import InSpacer from "./InSpacer.vue";
import InTable from "./table/InTable.vue";
import InRadioTable from "./table/InRadioTable.vue";
import InTabs from "./InTabs.vue";
import InBizTabs from "./tabs/InBizTabs.vue";
import InBizTabPanel from "./tabs/InBizTabPanel.vue";
import InBizTabsHeader from "./tabs/InBizTabsHeader.vue";
import InTitle from "./InTitle.vue";
import InTree from "./InTree.vue";
import InUpload from "./upload/InUpload.vue";
import InUploadAvatar from "./upload/InUploadAvatar.vue";
import InCommonUpload from "./upload/InCommonUpload.vue";
import InCommonUploadAvatar from "./upload/InCommonUploadAvatar.vue";
import InWithLabel from "./InWithLabel.vue";
import InRefreshIcon from "./icons/InRefreshIcon.vue";
import InInputTag from "./tag/InInputTag.vue";
import InTag from "./tag/InTag.vue";
import InTagEnum from "./tag/InTagEnum.vue";
import CommonStatusButton from "./status/CommonStatusButton.vue";
import CommonStatusTag from "./status/CommonStatusTag.vue";
import InStatusButton from "./status/InStatusButton.vue";
import AccountStatusEditButton from "./user/AccountStatusEditButton.vue";
import AccountStatusView from "./user/AccountStatusView.vue";

export const coreGlobalComponents: Record<string, Component> = {
  InButton,
  InButtonDelete,
  InButtonEdit,
  InContainer,
  InFilterContainer,
  InFilterItem,
  InCopyTag,
  InDialog,
  InDrawer,
  InEditor,
  InForm,
  InFormGroupTitle,
  InGlobalLoading,
  InIcon,
  InIconCollection,
  InPageHeader,
  InQrcode,
  InSelect,
  InPageSelect,
  InSpacer,
  InTable,
  InRadioTable,
  InTabs,
  InBizTabs,
  InBizTabPanel,
  InBizTabsHeader,
  InTitle,
  InTree,
  InUpload,
  InUploadAvatar,
  InCommonUpload,
  InCommonUploadAvatar,
  InWithLabel,
  InRefreshIcon,
  InInputTag,
  InTag,
  InTagEnum,
  CommonStatusButton,
  CommonStatusTag,
  InStatusButton,
  AccountStatusEditButton,
  AccountStatusView,
};

declare module "vue" {
  export interface GlobalComponents {
    InButton: typeof InButton;
    InButtonDelete: typeof InButtonDelete;
    InButtonEdit: typeof InButtonEdit;
    InContainer: typeof InContainer;
    InFilterContainer: typeof InFilterContainer;
    InFilterItem: typeof InFilterItem;
    InCopyTag: typeof InCopyTag;
    InDialog: typeof InDialog;
    InDrawer: typeof InDrawer;
    InEditor: typeof InEditor;
    InForm: typeof InForm;
    InFormGroupTitle: typeof InFormGroupTitle;
    InGlobalLoading: typeof InGlobalLoading;
    InIcon: typeof InIcon;
    InIconCollection: typeof InIconCollection;
    InPageHeader: typeof InPageHeader;
    InQrcode: typeof InQrcode;
    InSelect: typeof InSelect;
    InPageSelect: typeof InPageSelect;
    InSpacer: typeof InSpacer;
    InTable: typeof InTable;
    InRadioTable: typeof InRadioTable;
    InTabs: typeof InTabs;
    InBizTabs: typeof InBizTabs;
    InBizTabPanel: typeof InBizTabPanel;
    InBizTabsHeader: typeof InBizTabsHeader;
    InTitle: typeof InTitle;
    InTree: typeof InTree;
    InUpload: typeof InUpload;
    InUploadAvatar: typeof InUploadAvatar;
    InCommonUpload: typeof InCommonUpload;
    InCommonUploadAvatar: typeof InCommonUploadAvatar;
    InWithLabel: typeof InWithLabel;
    InRefreshIcon: typeof InRefreshIcon;
    InInputTag: typeof InInputTag;
    InTag: typeof InTag;
    InTagEnum: typeof InTagEnum;
    CommonStatusButton: typeof CommonStatusButton;
    CommonStatusTag: typeof CommonStatusTag;
    InStatusButton: typeof InStatusButton;
    AccountStatusEditButton: typeof AccountStatusEditButton;
    AccountStatusView: typeof AccountStatusView;
  }
}
