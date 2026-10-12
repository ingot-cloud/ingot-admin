# 整页配置表单布局

整页配置表单使用 `InFormContent` 包裹正文，在工作区内居中并限宽。适用于策略、系统参数等主要内容为阅读或维护配置的页面，以及混合页面里的配置 Tab。

## 布局规则

- `InPageFrame` 的页头和页级 Tab 保持工作区宽度。`InFormContent` 放在正文区域，包裹当前配置的说明、操作区、加载状态及表单。
- 正文最大宽度使用公开主题 Token `--in-form-content-max-width`，默认 `840px`；实际工作区不足时自动收缩。外层统一使用 `--in-space-5` 留白，内边距计入总宽度。
- 预览和编辑共用正文容器与字段排列，操作按钮在正文右上方并与正文右边缘对齐。
- 普通文本与数字字段通常两列；布尔或短选项可三列；长文本、备注、路径、标签集合独占一行。窄容器下字段收为一列。
- 配置通过分组标题、说明与 Token 间距组织。需要分别维护的配置可拆为页级 Tab；同一 Tab 内的多个配置组纵向排列，各自保留操作区。
- `InFormContent` 只负责宽度和留白。`InForm` / `InDetailField` 负责真实预览与编辑，页面负责请求、校验、权限和保存。
- 滚动仍由 `InPageFrame mode="page"` 或混合页面的当前面板负责，正文容器不新增滚动层。

## 用法

```vue
<in-page-frame mode="page" surface="workspace">
  <template #header>
    <in-page-header description="维护当前配置。" />
  </template>
  <template #tabs>
    <in-biz-tabs-header v-model="activeTab" :tabs="tabs" />
  </template>

  <in-form-content>
    <in-loading :loading="loading">
      <div class="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div class="min-w-0">配置说明</div>
        <div class="flex flex-wrap gap-2 ml-auto">
          <in-button v-if="!editing" @click="privateOnEditClick">编辑</in-button>
          <template v-else>
            <in-button @click="privateOnCancelClick">取消</in-button>
            <in-button type="primary" @click="privateOnSaveClick">保存</in-button>
          </template>
        </div>
      </div>
      <in-form :model="form" :editing="editing">
        <el-row :gutter="24">
          <el-col :xs="24" :sm="12">
            <in-detail-field label="名称" :value="form.name">
              <el-input v-if="editing" v-model="form.name" placeholder="请输入名称" />
            </in-detail-field>
          </el-col>
        </el-row>
      </in-form>
    </in-loading>
  </in-form-content>
</in-page-frame>
```

`InFormContent` 已在 admin-core 注册为全局组件，无须插件重复注册。主题通过正式 Token 覆盖机制调整最大宽度；业务页面沿用默认值。

## 适用边界与验收

列表继续使用填充工作区的 `InTable` / contained 布局；抽屉、对话框和局部表单使用各自容器。混合页面按当前内容选择布局，切到表格 Tab 时仍填充工作区。

验收应测量正文与可见控件的实际矩形：正文在工作区居中、宽度不超过 Token 或可用空间、操作区与字段共用边界。单独比较 document 的 scrollWidth 无法识别祖先裁切。覆盖预览/编辑、侧栏展开/收起、常规/宽/窄窗口及明暗主题，同时验证字段焦点与页面滚动可达。

本规范来自 [整页表单布局变更](../specs/changes/active/20261012-common-centered-form-layout/README.md)。
