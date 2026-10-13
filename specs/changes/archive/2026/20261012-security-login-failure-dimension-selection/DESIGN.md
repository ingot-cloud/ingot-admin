# 设计

页面路径仍为 /security/access-protection。LoginFailurePanel.vue 移除内层 InBizTabsHeader，将 Element Plus ElSegmented 放在 InFormContent 内，使用防护维度 aria-label 和已有四种维度枚举，保持 Query composable 及 visitedDimensions 的懒挂载。

选择器受控绑定 activeDimension，不在选择事件到达时立即改值。父组件先请求当前 LoginFailureDimensionPanel 的 prepareDimensionChange，再提交目标值；切换确认期间防重复，保存确认或请求期间禁用选择器。子面板编辑时记录可编辑字段快照，实际字段变化才使用 admin-core confirmUnsavedChanges；确认放弃或无变化时退出编辑并恢复服务端数据，取消确认保持原状态。ElSegmented 原生 radio 在异步拒绝切换时会先取消旧项勾选，因此拒绝后用局部 key 重建控件恢复实际勾选，并将焦点返回当前项，避免视觉和键盘状态不一致。

子面板按维度元数据提供策略标题，保存确认使用展示名；暴露维度、确认忙碌态和切换准备方法供父组件编排。忙碌态覆盖校验、确认和提交，防止异步校验期间切换到另一维度后仍提交旧表单；校验后和确认后均复核编辑资格。现有业务提示保留。选择器说明独立策略可同时启用，Client 文案改为客户端，账号与 IP 文案适当留空格；枚举值和业务条件不变。

InForm 的校验入口按现有回调契约调用，在子面板内部封装为 Promise 供保存流程等待，不修改共享表单 API。

布局复用正文 Token，不复制 840px。选择器横向摆放，在窄容器自然折到标签下方，使用框架颜色 Token 映射 ElSegmented 的局部颜色；不新增滚动层，继续由当前内容面板滚动。

兼容性：后端契约、资源操作码、缓存键、路由不变；仅插件内部组件实例接口增加方法。已访问隐藏面板继续不请求，丢弃草稿后回访恢复预览。

宪章符合性：Vue script setup/严格 TypeScript，业务留在 security 插件，使用现有 admin-core 和 Element Plus，无跨插件依赖，无共享包公开接口变化。
