# 设计

在 platform 插件内由 `BizPlatformAccountSelect` 共享 `InSelectionField` 和 `InDialog`。弹窗沿用角色分配成员选择的双栏容器、搜索图标、头像行和右栏已选操作。左栏用单选控件，右栏独立保存至多一个账号，打开时回显已确认项。

左栏在打开、清空筛选时通过 `PlatformAccountPageAPI` 加载第一页。账号读取资格通过现有 capabilities 判断。精确查询由按钮或回车触发，调用 `PlatformAccountLookupAPI`。点击分页列表中的账号同样经该接口按用途校验，并比较返回 ID 和所点账号 ID。候选切换和翻页保留右栏草稿。条件变化、关闭或权限上下文切换使待处理查询失效。

仅在添加平台成员场景传入排除已有平台成员的参数，直接采用服务端返回的账号页及总数。选中时的精确校验处理账号在列表加载后已加入平台的情况。

`pages/iam/tenants/components/CreateWizard.vue` 将确认项同步至所有者 ID。`pages/iam/personnel/components/MemberCreateDrawer.vue` 继续从确认项取得字段权限和初始联系方式，切换账号时重新初始化成员资料。未命中时的创建账号入口由成员抽屉处理。

## 宪章符合性

共用组件放在 platform 插件内，沿用共享设计系统与既有 API 模块。候选权限与成员资格由服务端判定。

按用户指定的参照，双栏用于区分搜索候选和单个已选账号。两处表单仍接收一个账号 ID。
