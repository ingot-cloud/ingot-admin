# 设计

遵循current/packages/admin-ui-foundation的REQ-011：头脚固定，普通正文或定高控件负责滚动。检查InWizard→正文→GrantPicker三列→InLoading内容→列表的高度传递；修复造成内容撑开、滚动区域无边界的层级，在共享布局处理相同原因，不增加业务页固定像素高度。

范围限定到向导及其三列列表，保留窄容器单栏的滚动所有者。用真实向导/权限树组件与模拟长目录进行浏览器测量，确认中间列表有scrollHeight>clientHeight，滚轮改变scrollTop，页脚始终在视口中；同时核对已选与平台共用入口。

## 宪章符合性

业务留在plugins，共享布局留在admin-core；不增加跨插件依赖。只恢复已有滚动行为，不改业务状态、接口或主题视觉，不提前更新current。

## 复现与修复点

InDrawer的pinned样式将直接子InLoading设为`min-height: unset`，计算值回到flex项的auto最小高度。InWizard覆盖了该节点的flex，却未恢复min-height:0；长树展开后，加载容器随内容从729px撑到906px，父级仍729px且overflow:hidden，树列表本身756px高且无内部溢出，所以滚轮无法访问被裁掉部分。

在InWizard现有pinned加载容器覆盖规则中补min-height:0，让该flex项可缩至可用高度，后代列表承担内部滚动。仅对向导生效，不修改通用InDrawer默认滚动或业务GrantPicker逻辑。
