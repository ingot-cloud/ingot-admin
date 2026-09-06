import type { Component } from "vue";
import InAvatar from "./avatar/InAvatar.vue";
import InButton from "./button/InButton.vue";
import InButtonDelete from "./button/InButtonDelete.vue";
import InButtonEdit from "./button/InButtonEdit.vue";
import InContainer from "./container/InContainer.vue";
import InSplitLayout from "./container/InSplitLayout.vue";
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
import InPageFrame from "./InPageFrame.vue";
import InQrcode from "./qrcode/InQrcode.vue";
import InSelect from "./select/InSelect.vue";
import InPageSelect from "./select/InPageSelect.vue";
import InSpacer from "./InSpacer.vue";
import InTable from "./table/InTable.vue";
import InTableActions from "./table/InTableActions.vue";
import InTableColumnSetting from "./table/InTableColumnSetting.vue";
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
import InCommonStatusTag from "./status/InCommonStatusTag.vue";
import InAccountStatusTag from "./status/InAccountStatusTag.vue";
import InStatusButton from "./status/InStatusButton.vue";
import AccountStatusEditButton from "./user/AccountStatusEditButton.vue";
import InAppBar from "../layouts/widgets/InAppBar.vue";
import InAppBarSearch from "../layouts/widgets/search/InAppBarSearch.vue";
import InLogo from "../layouts/widgets/InLogo.vue";
import InFullscreen from "../layouts/widgets/InFullscreen.vue";
import InGlobalSetting from "../layouts/widgets/InGlobalSetting.vue";
import InUserDropdown from "../layouts/widgets/user-dropdown/InUserDropdown.vue";
import InMenu from "../layouts/widgets/InMenu.vue";
import InSubmenu from "../layouts/widgets/InSubmenu.vue";
import InMenuToggle from "../layouts/widgets/InMenuToggle.vue";
import InBreadcrumb from "../layouts/widgets/breadcrumb/InBreadcrumb.vue";
import InCopyright from "../layouts/widgets/InCopyright.vue";
import InSwitchDark from "../layouts/widgets/switch-dark/InSwitchDark.vue";
import InCmpSize from "../layouts/widgets/cmp-size/InCmpSize.vue";

export const coreGlobalComponents: Record<string, Component> = {
  InAvatar,
  InButton,
  InButtonDelete,
  InButtonEdit,
  InContainer,
  InSplitLayout,
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
  InPageFrame,
  InQrcode,
  InSelect,
  InPageSelect,
  InSpacer,
  InTable,
  InTableActions,
  InTableColumnSetting,
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
  InCommonStatusTag,
  InAccountStatusTag,
  InStatusButton,
  AccountStatusEditButton,
  InAppBar,
  InAppBarSearch,
  InLogo,
  InFullscreen,
  InGlobalSetting,
  InUserDropdown,
  InMenu,
  InSubmenu,
  InMenuToggle,
  InBreadcrumb,
  InCopyright,
  InSwitchDark,
  InCmpSize,
};

declare module "vue" {
  export interface GlobalComponents {
    InAvatar: typeof InAvatar;
    InButton: typeof InButton;
    InButtonDelete: typeof InButtonDelete;
    InButtonEdit: typeof InButtonEdit;
    InContainer: typeof InContainer;
    InSplitLayout: typeof InSplitLayout;
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
    InPageFrame: typeof InPageFrame;
    InQrcode: typeof InQrcode;
    InSelect: typeof InSelect;
    InPageSelect: typeof InPageSelect;
    InSpacer: typeof InSpacer;
    InTable: typeof InTable;
    InTableActions: typeof InTableActions;
    InTableColumnSetting: typeof InTableColumnSetting;
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
    InCommonStatusTag: typeof InCommonStatusTag;
    InAccountStatusTag: typeof InAccountStatusTag;
    InStatusButton: typeof InStatusButton;
    AccountStatusEditButton: typeof AccountStatusEditButton;
    InAppBar: typeof InAppBar;
    InAppBarSearch: typeof InAppBarSearch;
    InLogo: typeof InLogo;
    InFullscreen: typeof InFullscreen;
    InGlobalSetting: typeof InGlobalSetting;
    InUserDropdown: typeof InUserDropdown;
    InMenu: typeof InMenu;
    InSubmenu: typeof InSubmenu;
    InMenuToggle: typeof InMenuToggle;
    InBreadcrumb: typeof InBreadcrumb;
    InCopyright: typeof InCopyright;
    InSwitchDark: typeof InSwitchDark;
    InCmpSize: typeof InCmpSize;
  }
}
