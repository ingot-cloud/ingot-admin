import path from "node:path";
import { fileURLToPath } from "node:url";
import { quoteTs, toPascal } from "./identifiers.mjs";
import { loadTemplateFiles, upsertFile } from "./files.mjs";
import { derivedThemeNames } from "./normalize.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const THEME_TEMPLATE_DIR = path.join(__dirname, "../../templates/admin-theme");

const serializeTokens = (tokens) => {
  const entries = Object.entries(tokens);
  if (entries.length === 0) {
    return "{}";
  }
  return `{
${entries.map(([key, value]) => `      ${quoteTs(key)}: ${quoteTs(value)},`).join("\n")}
    }`;
};

const renderThemeTs = (options) => {
  const shell = options.shell ? `\n  shell: ${toPascal(options.id)}Shell,` : "";
  const parts =
    options.parts.length > 0
      ? `\n  parts: {
${options.parts.map((part) => `    ${part}: ${toPascal(options.id)}${toPascal(part)},`).join("\n")}
  },`
      : "";
  const imports = [];
  if (options.shell) {
    imports.push(`import ${toPascal(options.id)}Shell from "./${toPascal(options.id)}Shell.vue";`);
  }
  for (const part of options.parts) {
    imports.push(
      `import ${toPascal(options.id)}${toPascal(part)} from "./parts/${toPascal(options.id)}${toPascal(part)}.vue";`,
    );
  }
  return `import { defineAdminTheme, INGOT_ADMIN_THEME_API_VERSION } from "@ingot/admin-core";
${imports.join("\n")}${imports.length ? "\n" : ""}
export const ${options.exportName} = defineAdminTheme({
  id: ${quoteTs(options.id)},
  apiVersion: INGOT_ADMIN_THEME_API_VERSION,
  name: ${quoteTs(options.name)},
  tokens: {
    light: ${serializeTokens(options.tokens.light)},
    dark: ${serializeTokens(options.tokens.dark)},
  },${shell}${parts}
});
`;
};

const shellVue = (options) => {
  const name = `${toPascal(options.id)}Shell`;
  return `<template>
  <div class="${options.id}-shell">
    <header v-if="$slots.header" class="${options.id}-shell__header">
      <slot name="header" />
    </header>
    <div class="${options.id}-shell__workspace">
      <aside v-if="$slots.navigation" class="${options.id}-shell__nav" :class="navClass">
        <slot name="navigation" />
      </aside>
      <div
        v-if="isOverlay && overlayOpen"
        class="${options.id}-shell__mask"
        aria-hidden="true"
        @click="closeOverlay"
      />
      <div class="${options.id}-shell__main">
        <div v-if="$slots.breadcrumb" class="${options.id}-shell__breadcrumb">
          <slot name="breadcrumb" />
        </div>
        <div class="${options.id}-shell__content">
          <slot name="content" />
        </div>
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useAdminShell } from "@ingot/admin-core";

defineOptions({
  name: "${name}",
});

const { isOverlay, overlayOpen, navigationMode, closeOverlay } = useAdminShell();

const navClass = computed(() => ({
  "is-overlay": isOverlay.value,
  "is-overlay-open": isOverlay.value && overlayOpen.value,
  "is-collapsed": navigationMode.value === "collapsed",
}));

const privateOnKey = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeOverlay();
  }
};

onMounted(() => {
  window.addEventListener("keydown", privateOnKey);
});

onUnmounted(() => {
  window.removeEventListener("keydown", privateOnKey);
});
</script>

<style scoped>
.${options.id}-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--in-bg-color-canvas);
}
.${options.id}-shell__header {
  flex: none;
  z-index: var(--in-z-header);
}
.${options.id}-shell__workspace {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
.${options.id}-shell__nav {
  flex: none;
  z-index: var(--in-z-sidebar);
  overflow: auto;
}
.${options.id}-shell__nav.is-overlay {
  position: absolute;
  inset: 0 auto 0 0;
  transform: translateX(-100%);
}
.${options.id}-shell__nav.is-overlay-open {
  transform: none;
}
.${options.id}-shell__mask {
  position: absolute;
  inset: 0;
  z-index: var(--in-z-overlay-mask);
  background: var(--in-overlay-mask);
}
.${options.id}-shell__main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.${options.id}-shell__content {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
`;
};

const partVue = (options, part) => {
  const name = `${toPascal(options.id)}${toPascal(part)}`;
  return `<template>
  <div class="${options.id}-part-${part}">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "${name}",
});
</script>
`;
};

const styleCss = (options) => `html[data-in-theme="${options.id}"] {
  /* 主题私有样式，使用主题 ID 作用域 */
}
`;

export const renderThemeFiles = (options) => {
  const names = derivedThemeNames(options);
  const tokens = {
    themeId: options.id,
    themeName: options.name,
    packageName: names.packageName,
    exportName: options.exportName,
    pascalName: toPascal(options.id),
  };
  let files = loadTemplateFiles(THEME_TEMPLATE_DIR, tokens);
  files = upsertFile(files, "src/theme.ts", renderThemeTs(options));
  files = upsertFile(
    files,
    "src/index.ts",
    `import "./style.css";\n\nexport { ${options.exportName} } from "./theme";\n`,
  );
  files = upsertFile(files, "src/style.css", styleCss(options));
  if (options.shell) {
    files = upsertFile(files, `src/${toPascal(options.id)}Shell.vue`, shellVue(options));
  }
  for (const part of options.parts) {
    files = upsertFile(
      files,
      `src/parts/${toPascal(options.id)}${toPascal(part)}.vue`,
      partVue(options, part),
    );
  }
  return { files, packageName: names.packageName };
};

export const themeNextSteps = (options) => {
  const names = derivedThemeNames(options);
  return [
    { title: "安装依赖", command: "pnpm install" },
    { title: "构建主题", command: `pnpm --filter ${names.packageName} build` },
    {
      title: "在宿主 App 声明依赖并引入",
      code: `import { ${options.exportName} } from "${names.packageName}";\nimport "${names.packageName}/style.css";\n\nawait bootstrapAdminApp({\n  theme: ${options.exportName},\n});`,
      language: "ts",
    },
    {
      title: "回退默认主题",
      code: `import { defaultAdminTheme } from "@ingot/admin-core";\nawait bootstrapAdminApp({ theme: defaultAdminTheme });`,
      language: "ts",
    },
  ];
};
