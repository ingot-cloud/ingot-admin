import { useLoginStore } from "@/stores/modules/login";
import type { LoginResult } from "@ingot/auth-core";

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

const handleLogin = (): Promise<LoginResult> => {
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
