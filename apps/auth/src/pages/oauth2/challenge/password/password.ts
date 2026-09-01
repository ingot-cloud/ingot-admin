import { useLoginStore } from "@/stores/modules/login";
import type { PreAuthorizeResult } from "@/models";

const formModel = reactive({
  username: "",
  password: "",
});

const loading = ref(false);

const init = () => {
  loading.value = false;
  formModel.username = "";
  formModel.password = "";
};

/**
 * 密码登录逻辑
 */
const handleLogin = (): Promise<PreAuthorizeResult> => {
  loading.value = true;
  return useLoginStore()
    .preAuthorize({
      username: formModel.username,
      password: formModel.password,
    })
    .then((result) => {
      loading.value = false;
      return result;
    })
    .catch((error: unknown) => {
      loading.value = false;
      throw error;
    });
};

export default {
  loading,
  formModel,
  init,
  handleLogin,
};
