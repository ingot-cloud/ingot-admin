<template>
  <in-drawer :title="title" v-model="visible" padding="0">
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

        <!-- 1.创建时候可以显示组织类型 2.不存在上级菜单那么不显示-->
        <el-form-item v-if="!edit && !editForm.pid" label="组织类型" prop="orgType">
          <in-select
            w-full
            v-model="editForm.orgType"
            placeholder="请选择类型"
            :options="orgTypeEnums.getOptions()"
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
          <el-input v-model="editForm.name" placeholder="请输入菜单名称" clearable></el-input>
        </el-form-item>

        <el-form-item prop="path" label="菜单路由" v-if="isDefaultLink()">
          <el-input v-model="editForm.path" placeholder="请输入菜单路由" clearable></el-input>
        </el-form-item>

        <el-form-item v-else label="外部链接" prop="linkUrl">
          <el-input
            v-model="editForm.linkUrl"
            placeholder="请输入外部链接 eg. https://www.baidu.com"
            clearable
          >
          </el-input>
        </el-form-item>

        <el-form-item label="重定向路由" v-if="isDirectory()">
          <el-input v-model="editForm.redirect" placeholder="请输入重定向路由" clearable></el-input>
        </el-form-item>

        <el-form-item prop="cache" label="是否开启权限">
          <el-radio-group v-model="editForm.enableAuthority">
            <el-radio-button :value="true"> 是 </el-radio-button>
            <el-radio-button :value="false"> 否 </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="!isButton()" prop="icon" label="菜单icon">
          <el-input v-model="editForm.icon" placeholder="请输入icon名称" clearable>
            <template #append>
              <div
                ref="iconButtonRef"
                v-click-outside="privateOnSettingClickOutside"
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
            <div flex flex-col items-center>
              <in-icon-collection @onItemClick="privateOnIconClick" />
            </div>
          </el-popover>
          <div>
            可以通过
            <a href="https://icon-sets.iconify.design/?query=" target="_blank"> iconify </a>
            搜索icon
          </div>
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
        <el-form-item
          v-if="editForm.customViewPath && !isButton()"
          label="视图路径"
          prop="viewPath"
        >
          <el-input v-model="editForm.viewPath" placeholder="请输入视图路径" clearable> </el-input>
        </el-form-item>
        <el-form-item
          v-if="editForm.customViewPath && !isButton() && isDirectory()"
          label="默认布局"
        >
          <in-select
            w-full
            v-model="editForm.viewPath"
            :options="LayoutOptions"
            placeholder="选择使用默认布局"
            clearable
            @onChanged="privateOnLayoutSelectChanged"
          />
        </el-form-item>
      </div>

      <in-form-group-title v-if="!isButton()" title="其他高级选项" v-model="moreOptionsFlag" />
      <div p-20px v-if="!isButton() && moreOptionsFlag">
        <el-form-item v-if="!isButton()" label="路由名称">
          <el-input v-model="editForm.routeName" placeholder="请输入路由名称" clearable></el-input>
        </el-form-item>
        <el-form-item v-if="!isButton() && moreOptionsFlag" prop="sort" label="排序">
          <el-input
            v-model="editForm.sort"
            placeholder="请输入排序序号"
            type="number"
            clearable
          ></el-input>
        </el-form-item>
        <el-row :gutter="20" v-if="!isButton() && moreOptionsFlag">
          <el-col :span="12">
            <el-form-item prop="cache" label="是否缓存">
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
        <el-row :gutter="20" v-if="!isButton() && moreOptionsFlag">
          <el-col :span="12">
            <el-form-item prop="hideBreadcrumb" label="隐藏面包屑">
              <el-radio-group v-model="editForm.hideBreadcrumb">
                <el-radio-button :value="true"> 是 </el-radio-button>
                <el-radio-button :value="false"> 否 </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="props" label="匹配props">
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
      <in-button v-if="edit" type="danger" @click="privateOnRemoveClick"> 删除 </in-button>
      <in-button :loading="loading" type="primary" @click="privateOnConfirmClick"> 确定 </in-button>
    </template>
  </in-drawer>
</template>
<script lang="ts" setup>
import { ClickOutside as vClickOutside } from "element-plus";
import type { SysMenu } from "@/models";
import { TreeKeyAndProps } from "@/models";
import { LayoutOptions, PageLayoutViewPath } from "@/router";
import {
  CommonStatus,
  CommonStatusEnumExtArray,
  MenuType,
  useMenuTypeEnum,
  useOrgTypeEnums,
  MenuLinkType,
  useMenuLinkTypeEnum,
} from "@/models/enums";
import { CreateMenuAPI, UpdateMenuAPI, RemoveMenuAPI } from "@/api/basic/menu";
import { Message } from "@/utils/message";
import { copyParams, getDiff } from "@/utils/object";

const rules = {
  name: [{ required: true, message: "请输入菜单名称", trigger: "blur" }],
  menuType: [{ required: true, message: "请选择菜单类型", trigger: "blur" }],
  orgType: [{ required: true, message: "请选择组织类型", trigger: "blur" }],
  path: [{ required: true, message: "请输入菜单url", trigger: "blur" }],
  viewPath: [{ required: true, message: "请输入视图路径", trigger: "blur" }],
  linkType: [{ required: true, message: "请选择链接类型", trigger: "blur" }],
  linkUrl: [{ required: true, message: "请输入链接URL", trigger: "blur" }],
};

const defaultEditForm: SysMenu = {
  id: undefined,
  pid: undefined,
  name: undefined,
  menuType: MenuType.Directory,
  path: undefined,
  enableAuthority: false,
  authorityId: undefined,
  authorityCode: undefined,
  routeName: undefined,
  customViewPath: false,
  viewPath: undefined,
  redirect: undefined,
  icon: undefined,
  sort: 999,
  isCache: false,
  hidden: false,
  hideBreadcrumb: false,
  props: false,
  linkType: MenuLinkType.Default,
  linkUrl: undefined,
  orgType: undefined,
  status: CommonStatus.Enable,
};

const orgTypeEnums = useOrgTypeEnums();
const menuTypeEnum = useMenuTypeEnum();
const menuLinkTypeEnum = useMenuLinkTypeEnum();

const emits = defineEmits(["success"]);
defineProps({
  selectData: {
    type: Array,
  },
});

const moreOptionsFlag = ref(false);
const statusEnum = useEnum(CommonStatusEnumExtArray);
const iconButtonRef = ref();
const iconPopoverRef = ref();
const editFormRef = ref();
const editForm = reactive(Object.assign({}, defaultEditForm));
const rawForm: SysMenu = {};
const loading = ref(false);
const title = ref("");
const edit = ref(false);
const canEditPid = ref(false);
const visible = ref(false);

const confirmDelete = useConfirmDelete(transformDeleteAPI(RemoveMenuAPI), () => {
  visible.value = false;
  emits("success");
});

const isDirectory = () => {
  return editForm.menuType == MenuType.Directory;
};

const isMenu = () => {
  return editForm.menuType == MenuType.Menu;
};
const isButton = () => {
  return editForm.menuType == MenuType.Button;
};
const isDefaultLink = () => {
  return editForm.linkType == MenuLinkType.Default;
};

const privateOnMenuTypeChange = () => {
  editForm.linkType = MenuLinkType.Default;
};

const privateOnRemoveClick = () => {
  confirmDelete.exec(editForm.id!, `是否删除菜单${editForm.name}`, "删除成功");
};

const privateOnConfirmClick = () => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (valid) {
      let request;

      // 如果选择了非默认链接类型，那么设置customViewPath为true修改viewPath
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

      if (edit.value) {
        const params = getDiff<SysMenu>(rawForm, editForm);
        if (Object.keys(params).length === 0) {
          Message.warning("未改变数据");
          return;
        }
        params.id = rawForm.id;
        request = UpdateMenuAPI(params);
      } else {
        request = CreateMenuAPI(Object.assign({}, toRaw(editForm)));
      }

      loading.value = true;
      request
        .then(() => {
          loading.value = false;
          Message.success("操作成功");
          visible.value = false;
          emits("success");
        })
        .catch(() => {
          loading.value = false;
        });
    }
  });
};
const privateOnIconClick = (name: string) => {
  editForm.icon = name;
  privateOnSettingClickOutside();
};
const privateOnSettingClickOutside = () => {
  unref(iconPopoverRef).popperRef?.delayHide?.();
};
const privateOnLayoutSelectChanged = (value: string) => {
  editForm.viewPath = value;
};

defineExpose({
  show(data?: SysMenu | string) {
    visible.value = true;
    moreOptionsFlag.value = false;
    // 重置数据
    copyParams(editForm, defaultEditForm);
    copyParams(rawForm, defaultEditForm);
    nextTick(() => {
      const form = unref(editFormRef);
      form.clearValidate();
    });

    if (data) {
      if (typeof data === "string") {
        title.value = "添加菜单";
        edit.value = false;
        canEditPid.value = false;
        editForm.pid = data;
        // 添加子菜单默认类型为菜单
        editForm.menuType = MenuType.Menu;
      } else {
        if (data.authorityId === "0") {
          data.authorityId = undefined;
        }
        copyParams(editForm, data);
        copyParams(rawForm, data);
        title.value = "编辑菜单";
        edit.value = true;
        canEditPid.value = false;
      }
    } else {
      title.value = "添加菜单";
      edit.value = false;
      canEditPid.value = true;
      editForm.menuType = MenuType.Directory;
    }
  },
});
</script>
