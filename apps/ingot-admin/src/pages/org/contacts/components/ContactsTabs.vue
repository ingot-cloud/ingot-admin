<template>
  <in-biz-tabs-header :modelValue="selectTab" :tabs="tabs" @change="onItemClick" />
</template>
<script lang="ts" setup>
defineProps({
  selectTab: {
    type: String,
    required: true,
  },
});
const tabs = ref([
  {
    id: "成员",
    title: "成员",
  },
  {
    id: "部门",
    title: "部门",
  },
  {
    id: "角色",
    title: "角色",
  },
  {
    id: "权限",
    title: "权限",
  },
  {
    id: "组织架构",
    title: "组织架构",
  },
]);
const go = useGo();
const onItemClick = (tab: string) => {
  switch (tab) {
    case "成员":
      go({
        path: "/org/contacts/member",
      });
      break;
    case "部门":
      go({
        path: "/org/contacts/dept",
      });
      break;
    case "角色":
      go({
        path: "/org/contacts/role",
      });
      break;
    case "权限":
      go({
        path: "/org/contacts/auth",
      });
      break;
    case "组织架构":
      go({
        path: "/org/contacts/orgstructure",
      });
      break;
  }
};
</script>
