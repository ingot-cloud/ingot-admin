<template>
  <in-drawer :title="title" v-model="visible" padding="0" width="560px">
    <in-form ref="editFormRef" class="form" :model="editForm" :rules="rules">
      <in-form-group-title title="基础信息" hide-action />
      <div p-20px>
        <el-form-item label="菜单类型" prop="menuType">
          <in-select
            w-full
            v-model="editForm.menuType"
            :options="menuTypeEnum.getOptions()"
            @change="privateOnMenuTypeChange"
          />
        </el-form-item>
        <el-form-item label="上级菜单">
          <el-tree-select
            w-full
            v-model="editForm.pid"
            :data="selectData"
            :disabled="!canEditPid"
            :node-key="TreeKeyAndProps.nodeKey"
            :value-key="TreeKeyAndProps.nodeKey"
            :props="TreeKeyAndProps.props"
            :check-strictly="true"
          />
        </el-form-item>
        <el-form-item label="链接类型" prop="linkType" v-if="isMenu()">
          <in-select
            w-full
            v-model="editForm.linkType"
            placeholder="请选择类型"
            :options="menuLinkTypeEnum.getOptions()"
          />
        </el-form-item>
        <el-form-item prop="name" label="菜单名称">
          <el-input v-model="editForm.name" placeholder="请输入菜单名称" clearable />
        </el-form-item>
        <el-form-item prop="path" label="菜单路由" v-if="isDefaultLink()">
          <el-input v-model="editForm.path" placeholder="请输入菜单路由" clearable />
        </el-form-item>
        <el-form-item v-else label="外部链接" prop="linkUrl">
          <el-input
            v-model="editForm.linkUrl"
            placeholder="请输入外部链接 eg. https://www.baidu.com"
            clearable
          />
        </el-form-item>
        <el-form-item label="重定向路由" v-if="isDirectory()">
          <el-input v-model="editForm.redirect" placeholder="请输入重定向路由" clearable />
        </el-form-item>
        <el-form-item label="访问模式" prop="accessMode">
          <in-select w-full v-model="editForm.accessMode" :options="accessModeEnum.getOptions()" />
        </el-form-item>
        <el-form-item v-if="!isButton()" prop="icon" label="菜单 icon">
          <el-input v-model="editForm.icon" placeholder="请输入 icon 名称" clearable>
            <template #append>
              <div
                ref="iconButtonRef"
                v-click-outside="privateOnIconPopoverClose"
                w-full
                h-full
                flex
                items-center
                justify-center
                cursor-pointer
              >
                <in-icon
                  :name="editForm.icon"
                  class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
                />
              </div>
            </template>
          </el-input>
          <el-popover
            ref="iconPopoverRef"
            trigger="click"
            placement="bottom"
            :width="300"
            :virtual-ref="iconButtonRef"
            virtual-triggering
          >
            <in-icon-collection @onItemClick="privateOnIconSelect" />
          </el-popover>
        </el-form-item>
        <el-form-item prop="sort" label="排序">
          <el-input-number v-model="editForm.sort" :min="0" :max="9999" w-full />
        </el-form-item>
        <el-form-item prop="sort" label="备注">
          <el-input
            v-model="editForm.remark"
            :autosize="{ minRows: 2, maxRows: 4 }"
            maxlength="200"
            show-word-limit
            type="textarea"
            w-full
          />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-radio-group v-model="editForm.status">
            <el-radio-button :value="CommonStatus.Enable">
              {{ statusEnum.getTagText(CommonStatus.Enable).text }}
            </el-radio-button>
            <el-radio-button :value="CommonStatus.Lock">
              {{ statusEnum.getTagText(CommonStatus.Lock).text }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
      </div>

      <in-form-group-title
        v-if="!isButton() && isDefaultLink()"
        title="视图高级选项"
        v-model="editForm.customViewPath"
      />
      <div p-20px v-if="!isButton() && isDefaultLink() && editForm.customViewPath">
        <el-form-item label="布局类型">
          <in-select
            w-full
            v-model="currentSelectLayoutOption"
            :options="LayoutOptions"
            placeholder="选择使用的布局类型"
            @onChanged="privateOnLayoutSelectChanged"
          />
        </el-form-item>
        <el-form-item
          label="视图路径"
          prop="viewPath"
          v-if="currentSelectLayoutOption === PageLayoutViewPath.CUSTOM"
        >
          <el-input v-model="editForm.viewPath" placeholder="请输入视图路径" clearable />
        </el-form-item>
      </div>

      <in-form-group-title v-if="!isButton()" title="其他高级选项" v-model="moreOptionsFlag" />
      <div p-20px v-if="!isButton() && moreOptionsFlag">
        <el-form-item label="路由名称">
          <el-input v-model="editForm.routeName" placeholder="请输入路由名称" clearable />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item prop="isCache" label="是否缓存">
              <el-radio-group v-model="editForm.isCache">
                <el-radio-button :value="true"> 是 </el-radio-button>
                <el-radio-button :value="false"> 否 </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="hidden" label="隐藏菜单">
              <el-radio-group v-model="editForm.hidden">
                <el-radio-button :value="true"> 是 </el-radio-button>
                <el-radio-button :value="false"> 否 </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item prop="hideBreadcrumb" label="隐藏面包屑">
              <el-radio-group v-model="editForm.hideBreadcrumb">
                <el-radio-button :value="true"> 是 </el-radio-button>
                <el-radio-button :value="false"> 否 </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="props" label="匹配 props">
              <el-radio-group v-model="editForm.props">
                <el-radio-button :value="true"> 是 </el-radio-button>
                <el-radio-button :value="false"> 否 </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </in-form>
    <template #footer>
      <in-button v-if="edit" type="danger" @click="privateOnRemove">删除</in-button>
      <in-button :loading="loading" type="primary" @click="privateOnConfirm">确定</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { ClickOutside as vClickOutside } from "element-plus";
import type { PlatformMenu } from "@/models";
import { TreeKeyAndProps } from "@/models";
import { LayoutOptions, PageLayoutViewPath } from "@/router";
import {
  AccessModeEnum,
  CommonStatus,
  CommonStatusEnumExtArray,
  MenuLinkType,
  MenuType,
  useAccessModeEnum,
  useMenuLinkTypeEnum,
  useMenuTypeEnum,
} from "@/models/enums";
import { CreateAppMenuAPI, RemoveAppMenuAPI, UpdateAppMenuAPI } from "@/api/platform/config/app";
import { copyParams, getDiff } from "@/utils/object";
import type { TreeData } from "element-plus";

const props = defineProps<{
  appId: string;
  selectData: TreeData;
}>();

const emit = defineEmits<{
  success: [];
}>();

const rules = {
  name: [{ required: true, message: "请输入菜单名称", trigger: "blur" }],
  menuType: [{ required: true, message: "请选择菜单类型", trigger: "blur" }],
  path: [{ required: true, message: "请输入菜单路由", trigger: "blur" }],
  linkType: [{ required: true, message: "请选择链接类型", trigger: "blur" }],
  linkUrl: [{ required: true, message: "请输入链接 URL", trigger: "blur" }],
  accessMode: [{ required: true, message: "请选择访问模式", trigger: "change" }],
  viewPath: [{ required: true, message: "请输入视图路径", trigger: "blur" }],
};

const defaultEditForm: PlatformMenu = {
  pid: undefined,
  name: undefined,
  menuType: MenuType.Directory,
  path: undefined,
  accessMode: AccessModeEnum.Permission,
  permissionCode: undefined,
  routeName: undefined,
  customViewPath: false,
  viewPath: undefined,
  redirect: undefined,
  icon: undefined,
  sort: 10,
  isCache: false,
  hidden: false,
  hideBreadcrumb: false,
  props: false,
  linkType: MenuLinkType.Default,
  linkUrl: undefined,
  status: CommonStatus.Enable,
  remark: undefined,
};

const menuTypeEnum = useMenuTypeEnum();
const menuLinkTypeEnum = useMenuLinkTypeEnum();
const accessModeEnum = useAccessModeEnum();
const statusEnum = useEnum(CommonStatusEnumExtArray);
const message = useMessage();

const currentSelectLayoutOption = ref(LayoutOptions[0].value);
const moreOptionsFlag = ref(false);
const editFormRef = ref();
const iconButtonRef = ref();
const iconPopoverRef = ref();
const editForm = reactive<PlatformMenu>({ ...defaultEditForm });
const rawForm = reactive<PlatformMenu>({});
const loading = ref(false);
const title = ref("");
const edit = ref(false);
const canEditPid = ref(false);
const visible = ref(false);

const confirmDelete = useConfirmDelete(
  transformDeleteAPI((id: string) => RemoveAppMenuAPI(props.appId, id)),
  () => {
    visible.value = false;
    emit("success");
  },
);

const isDirectory = (): boolean => editForm.menuType === MenuType.Directory;
const isMenu = (): boolean => editForm.menuType === MenuType.Menu;
const isButton = (): boolean => editForm.menuType === MenuType.Button;
const isDefaultLink = (): boolean => editForm.linkType === MenuLinkType.Default;

const privateOnMenuTypeChange = (): void => {
  editForm.linkType = MenuLinkType.Default;
};

const privateOnIconSelect = (name: string): void => {
  editForm.icon = name;
  privateOnIconPopoverClose();
};

const privateOnIconPopoverClose = (): void => {
  unref(iconPopoverRef)?.popperRef?.delayHide?.();
};

const privateOnLayoutSelectChanged = (value: string): void => {
  if (value === PageLayoutViewPath.CUSTOM) {
    editForm.viewPath = undefined;
  } else {
    editForm.viewPath = value;
  }
};

const privateOnRemove = (): void => {
  confirmDelete.exec(editForm.id!, `是否删除菜单(${editForm.name})`, "删除成功");
};

const privateOnConfirm = (): void => {
  unref(editFormRef)?.validate((valid: boolean) => {
    if (!valid) {
      return;
    }

    // 非默认链接类型时，强制使用自定义视图路径并指向对应的内置布局
    if (editForm.linkType !== MenuLinkType.Default) {
      editForm.customViewPath = true;
      switch (editForm.linkType) {
        case MenuLinkType.IFrame:
          editForm.viewPath = PageLayoutViewPath.IFRAME;
          break;
        case MenuLinkType.External:
          editForm.viewPath = PageLayoutViewPath.EXTERNAL;
          break;
      }
    }

    let request: Promise<unknown>;
    if (edit.value) {
      const params = getDiff<PlatformMenu>(rawForm, editForm);
      if (Object.keys(params).length === 0) {
        message.warning("未改变数据");
        return;
      }
      request = UpdateAppMenuAPI(props.appId, rawForm.id!, params);
    } else {
      const payload = { ...toRaw(editForm) };
      if (!payload.pid) {
        payload.pid = "0";
      }
      request = CreateAppMenuAPI(props.appId, payload);
    }
    loading.value = true;
    request
      .then(() => {
        message.success("操作成功");
        visible.value = false;
        emit("success");
      })
      .finally(() => {
        loading.value = false;
      });
  });
};

defineExpose({
  show(data?: PlatformMenu | string): void {
    visible.value = true;
    moreOptionsFlag.value = false;
    copyParams(editForm, defaultEditForm);
    copyParams(rawForm, defaultEditForm);
    nextTick(() => {
      unref(editFormRef)?.clearValidate();
    });

    if (data) {
      if (typeof data === "string") {
        title.value = "添加菜单";
        edit.value = false;
        canEditPid.value = false;
        editForm.pid = data;
        editForm.menuType = MenuType.Menu;
      } else {
        copyParams(editForm, data);
        copyParams(rawForm, data);
        if (!editForm.accessMode) {
          editForm.accessMode = AccessModeEnum.Permission;
        }
        title.value = "编辑菜单";
        edit.value = true;
        canEditPid.value = false;
      }
      return;
    }

    title.value = "添加菜单";
    edit.value = false;
    canEditPid.value = true;
    editForm.menuType = MenuType.Directory;
  },
});
</script>
