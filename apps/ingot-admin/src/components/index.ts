import type { App } from "vue";
import vue3TreeOrg from "vue3-tree-org";
import "vue3-tree-org/lib/vue3-tree-org.css";

/**
 * components目录中的.vue文件会自动注册。
 * 该文件主要用于手动注册组件，主要处理第三方组件。
 */
export default {
  install(app: App) {
    app.use(vue3TreeOrg); // 组织架构组件
  },
};
