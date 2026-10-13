# 需求

1. 通用标签支持 primary、success、info、warning、danger，采用现有状态标签的浅底、圆角、字重和间距规范；普通标签不强制显示状态图标。
2. InTag.value、InTagEnum.value/enumObj、StatusTag.tone/label 保持兼容。StatusTag 的正常/启用仍显示蓝色成功图标，暂停和锁定语义不变。
3. 保留 Element Plus 的 small/default/large、light/plain/dark、round、hit、color、disable-transitions，以及点击与关闭行为；关闭不触发外层点击。
4. 直接使用 ElTag 的业务标签、选择标签和复制标签共享基础外观。新增通用默认内容插槽与可选 icon 插槽。
5. 标签在明暗主题中使用统一 Ingot Token，不在业务页面维护主题分支；已有 status Token 的主题覆盖仍生效。

## 验收

- 组件回归覆盖五类型、属性透传、关闭/点击隔离、枚举变化、插槽与现有业务状态。
- 主题注册、CSS、浅深默认值一致，无反向依赖或变量循环。
- 类型检查、限定 ESLint 与相关共享包测试通过；浏览器检查五色、三尺寸/效果、状态图标、关闭交互及明暗展示。
- 不新增依赖或后端接口。
