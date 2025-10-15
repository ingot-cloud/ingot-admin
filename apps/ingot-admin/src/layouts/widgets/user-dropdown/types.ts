export interface UserDropdownCommand {
  action: "fixPwd" | "logout" | "user";
  params: string;
}

export interface UserDropdownMenuItem {
  divided: boolean;
  command: UserDropdownCommand;
  icon: string;
  title: string;
  style?: any;
}

export const menuList: Array<UserDropdownMenuItem> = [
  // {
  //   divided: false,
  //   command: { action: "user", params: "" },
  //   icon: "ep-user",
  //   title: "个人信息",
  // },
  {
    divided: true,
    command: { action: "fixPwd", params: "" },
    icon: "ep-edit",
    title: "修改密码",
  },
  {
    divided: true,
    command: { action: "logout", params: "" },
    icon: "ep-switch-button",
    title: "退出登录",
    style: {
      color: "#ff5219",
    },
  },
];
