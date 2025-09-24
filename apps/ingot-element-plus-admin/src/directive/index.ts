import type { App } from "vue";
import { authDirective } from "./authDirective";
import { wavesDirective } from "./wavesDirective";

export default {
  install(app: App) {
    authDirective(app);
    wavesDirective(app);
  },
};
