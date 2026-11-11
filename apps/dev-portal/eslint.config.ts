import { vueConfig } from "../../eslint.config.vue";

export default Promise.resolve(vueConfig).then((config) => [
  ...config,
  {
    name: "dev-portal/node-scripts",
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
