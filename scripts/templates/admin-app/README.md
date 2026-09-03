# {{appTitle}}

本目录由 create-app 生成，是一个**独立后台 App** 的 composition root。

普通单后台项目请直接使用仓库里的 `apps/admin`。只有在需要独立 appCode、品牌、环境变量、构建产物或部署流水线时，才应创建本应用。

## 下一步

1. 在仓库根目录执行 `pnpm install`
2. 按需修改 `.env` 与 `src/plugins.ts`
3. 本 App 扩展放 `src/pages` / `components` / `hooks` / `stores` 等约定目录，不必改 `app-plugin.ts`
4. 从 `src/plugins.ts` 和 `package.json` 同步增删官方插件依赖
5. 让后端应用 / OAuth Client 只返回本 App 需要的菜单
6. `pnpm --filter {{appCode}} dev`

更完整的说明见仓库 `docs/app-development.md` 与 `docs/create-app.md`。
