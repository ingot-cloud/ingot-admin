# ingot-admin

### 登录页配色

在本应用的 `.env` 或对应环境的 `.env.development` / `.env.production` 配置：

```dotenv
VITE_APP_LOGIN_COLOR_SCHEME=light
```

可选值：`light` 固定浅色（默认）、`dark` 固定深色、`auto` 跟随系统。未配置、空值或非法值回退浅色。环境配置直接决定登录页配色，历史浏览器主题偏好不会覆盖配置。开发时修改后重启服务，生产需要重新构建。两端共用的策略实现位于 `plugins/auth/src/appearance.ts`。

### 技术栈
  * [vue3](https://github.com/vuejs/core)
  * [vite](https://github.com/vitejs/vite)
  * [pinia](https://github.com/vuejs/pinia)
  * [pinia-plugin-persistedstate](https://github.com/prazdevs/pinia-plugin-persistedstate)
  * [element-plus](https://github.com/element-plus/element-plus)
  * [vueuse](https://github.com/vueuse/vueuse)
  * [unocss](https://github.com/unocss/unocss)
  * [axios](https://github.com/axios/axios)
  * [iconify](https://github.com/iconify/iconify)

### vite plugin
  * [unplugin-auto-import](https://github.com/antfu/unplugin-auto-import)
  * [vite-plugin-components](https://github.com/antfu/vite-plugin-components)
  * [unplugin-icons](https://github.com/antfu/unplugin-icons)
  * [unocss](https://github.com/unocss/unocss)


### TODO
  * [ ] Form封装，通过JSON生成具体Form表单
  * [ ] 表单设计，可以输出JSON
  * [ ] 工作流
  * [ ] 移动端后管系统
  * [ ] 开发环境，根据创建菜单内容，创建对应业务模板代码
  * [ ] 图片上传组件优化，增加可扩展性
  * [ ] 地图组件封装
