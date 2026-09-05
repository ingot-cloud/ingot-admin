export interface UserDropdownCommand {
  action: "fixPwd" | "logout" | "user" | "switchOrg";
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
  {
    divided: true,
    command: { action: "switchOrg", params: "" },
    icon: "icon-park:switch",
    title: "切换组织",
  },
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
