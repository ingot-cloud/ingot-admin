import path from "node:path";
import { fileURLToPath } from "node:url";
import { kebabToDot, quoteTs, toCamel, toPascal } from "./identifiers.mjs";
import { loadTemplateFiles, upsertFile } from "./files.mjs";
import { derivedPluginNames } from "./normalize.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PLUGIN_TEMPLATE_DIR = path.join(__dirname, "../../templates/admin-plugin");

const renderPluginTs = (options) => {
  const extras = [];
  if (options.withDemo || options.extensions.components) {
    extras.push(`  components: domainGlobalComponents,`);
  }
  if (options.extensions.directives || options.withDemo) {
    extras.push(`  directives: domainDirectives,`);
  }
  if (options.withDemo) {
    extras.push(`  staticMenus: createPluginMenus(),`);
  }
  const demoImports = [];
  if (options.withDemo || options.extensions.components) {
    demoImports.push(`import { domainGlobalComponents } from "./components/global";`);
  }
  if (options.extensions.directives || options.withDemo) {
    demoImports.push(`import { domainDirectives } from "./directives";`);
  }
  if (options.withDemo) {
    demoImports.push(`import { createPluginMenus } from "./menus";`);
  }
  const install = options.extensions.install
    ? `
  install(ctx) {
    void ctx;
  },`
    : "";
  const layouts = options.extensions.layouts
    ? `
  layouts: definePluginPages({
    modules: layoutModules,
    sourceRoot: "./layouts",
    canonicalPrefix: ${quoteTs(`${options.canonicalPrefix}.layout`)},
  }),`
    : "";
  const layoutGlob = options.extensions.layouts
    ? `\nconst layoutModules = import.meta.glob<InPageModule>("./layouts/**/*.vue");\n`
    : "";
  return `import type { Component } from "vue";
import {
  definePluginPages,
  INGOT_ADMIN_PLUGIN_API_VERSION,
  type InAdminPlugin,
} from "@ingot/admin-core";
${demoImports.join("\n")}${demoImports.length ? "\n" : ""}
interface InPageModule {
  default: Component;
}

const modules = import.meta.glob<InPageModule>("./pages/**/*.vue");
${layoutGlob}
export const ${options.exportName}: InAdminPlugin = {
  id: ${quoteTs(options.pluginId)},
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn: ["ingot-admin-core"],
  pages: definePluginPages({
    modules,
    sourceRoot: "./pages",
    canonicalPrefix: ${quoteTs(options.canonicalPrefix)},
  }),${layouts}
${extras.join("\n")}${install}
};
`;
};

const renderMenus = (options) => `import { MenuType, defineStaticMenus } from "@ingot/admin-core";

export const createPluginMenus = () =>
  defineStaticMenus([
    {
      name: ${quoteTs(options.directoryId)},
      path: ${quoteTs(`/${options.directoryId}`)},
      routeName: ${quoteTs(`${toPascal(options.directoryId)}Root`)},
      menuType: MenuType.Directory,
      children: [
        {
          name: "概览",
          path: ${quoteTs(`/${options.directoryId}/overview`)},
          routeName: ${quoteTs(`${toPascal(options.directoryId)}Overview`)},
          menuType: MenuType.Menu,
          viewPath: ${quoteTs(`${options.canonicalPrefix}.demo.overview`)},
        },
        {
          name: "列表示例",
          path: ${quoteTs(`/${options.directoryId}/list`)},
          routeName: ${quoteTs(`${toPascal(options.directoryId)}List`)},
          menuType: MenuType.Menu,
          viewPath: ${quoteTs(`${options.canonicalPrefix}.demo.list`)},
        },
      ],
    },
  ]);
`;

const overviewPage = (options) => {
  const compName = `Biz${toPascal(options.directoryId)}Badge`;
  const badgeImport =
    options.withDemo || options.extensions.components
      ? `import ${compName} from "@/components/${compName}.vue";\n`
      : "";
  return `<template>
  <in-container>
    <in-page-header title="插件概览" subtitle="由源码插件注册的稳定页面键" />
    <el-card shadow="never">
      <p>插件 ID：${options.pluginId}</p>
      <p>页面键：${options.canonicalPrefix}.demo.overview</p>
      ${options.withDemo || options.extensions.components ? `<${compName} />` : ""}
    </el-card>
  </in-container>
</template>

<script setup lang="ts">
${badgeImport}defineOptions({
  name: "${toPascal(options.directoryId)}OverviewPage",
});
</script>
`;
};

const badgeVue = (options) => {
  const name = `Biz${toPascal(options.directoryId)}Badge`;
  return `<template>
  <el-tag type="success" effect="plain">{{ label }}</el-tag>
</template>

<script setup lang="ts">
defineOptions({
  name: "${name}",
});

withDefaults(
  defineProps<{
    label?: string;
  }>(),
  {
    label: "${name}",
  },
);
</script>
`;
};

const globalComponents = (options) => {
  const name = `Biz${toPascal(options.directoryId)}Badge`;
  return `import ${name} from "./${name}.vue";

export const domainGlobalComponents = {
  ${name},
};
`;
};

const directiveFile = `import type { Directive } from "vue";

const highlightDirective: Directive<HTMLElement, string | undefined> = {
  mounted(el, binding) {
    el.classList.add("plugin-demo-highlight");
    if (binding.value) {
      el.dataset.demoLabel = binding.value;
    }
  },
};

export default highlightDirective;
`;

const directivesIndex = `import highlightDirective from "./highlight";

export const domainDirectives = {
  "demo-highlight": highlightDirective,
};
`;

const storeFile = (options) => `export const use${toPascal(options.directoryId)}Store = defineStore(${quoteTs(`${options.canonicalPrefix}.shared`)}, () => {
  const counter = ref(0);
  const increment = () => {
    counter.value += 1;
  };
  return { counter, increment };
});
`;

export const renderPluginFiles = (options) => {
  const names = derivedPluginNames(options);
  const tokens = {
    directoryId: options.directoryId,
    pluginId: options.pluginId,
    packageName: names.packageName,
    exportName: options.exportName,
    canonicalPrefix: options.canonicalPrefix,
    description: options.description,
    camelName: toCamel(options.directoryId),
    pascalName: toPascal(options.directoryId),
    pageKeyPrefix: kebabToDot(options.directoryId),
  };
  let files = loadTemplateFiles(PLUGIN_TEMPLATE_DIR, tokens);
  files = upsertFile(files, "src/plugin.ts", renderPluginTs(options));
  if (options.withDemo) {
    files = upsertFile(files, "src/menus.ts", renderMenus(options));
    files = upsertFile(files, "src/pages/demo/overview/IndexPage.vue", overviewPage(options));
    files = upsertFile(
      files,
      "src/pages/demo/list/IndexPage.vue",
      `<template>
  <in-container>
    <in-table :headers="headers" :data="rows" />
  </in-container>
</template>
<script setup lang="ts">
import { headers } from "./table";
import { useOps } from "./useOps";

defineOptions({ name: "${toPascal(options.directoryId)}ListPage" });
const { rows } = useOps();
</script>
`,
    );
    files = upsertFile(
      files,
      "src/pages/demo/list/table.ts",
      `import type { TableHeaderRecord } from "@ingot/admin-core";

export const headers: TableHeaderRecord[] = [
  { title: "名称", dataKey: "name" },
];
`,
    );
    files = upsertFile(
      files,
      "src/pages/demo/list/useOps.ts",
      `export const useOps = () => {
  const rows = ref([{ name: "示例行" }]);
  return { rows };
};
`,
    );
  } else {
    files = upsertFile(files, "src/pages/.gitkeep", "");
  }
  if (options.withDemo || options.extensions.components) {
    const compName = `Biz${toPascal(options.directoryId)}Badge`;
    files = upsertFile(files, `src/components/${compName}.vue`, badgeVue(options));
    files = upsertFile(files, "src/components/global.ts", globalComponents(options));
  } else {
    files = upsertFile(files, "src/components/.gitkeep", "");
  }
  if (options.withDemo || options.extensions.directives) {
    files = upsertFile(files, "src/directives/highlight.ts", directiveFile);
    files = upsertFile(files, "src/directives/index.ts", directivesIndex);
  } else {
    files = upsertFile(files, "src/directives/.gitkeep", "");
  }
  if (options.extensions.stores || options.withDemo) {
    files = upsertFile(files, `src/stores/${toCamel(options.directoryId)}.ts`, storeFile(options));
  } else {
    files = upsertFile(files, "src/stores/.gitkeep", "");
  }
  files = upsertFile(files, "src/api/.gitkeep", "");
  files = upsertFile(files, "src/models/.gitkeep", "");
  if (options.extensions.layouts) {
    files = upsertFile(files, "src/layouts/.gitkeep", "");
  }
  files = upsertFile(files, "src/hooks/.gitkeep", "");
  return { files, packageName: names.packageName };
};

export const pluginNextSteps = (options) => {
  const names = derivedPluginNames(options);
  return [
    { title: "安装依赖", command: "pnpm install" },
    {
      title: "在宿主 App 声明依赖",
      code: `"${names.packageName}": "workspace:*"`,
      language: "json",
    },
    {
      title: "注册插件并加入 officialPlugins",
      code: `import { ${options.exportName} } from "${names.packageName}";\n// plugins.ts 加入 ${options.exportName}\n// vite.config.ts officialPlugins 加入 "${names.packageName}"`,
      language: "ts",
    },
    { title: "类型检查", command: `pnpm --filter ${names.packageName} type-check` },
    {
      title: "不要执行",
      command: "本模板不提供独立 HTML / dev / preview / production build",
    },
  ];
};
