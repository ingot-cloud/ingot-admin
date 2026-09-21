import { reactive, ref } from "vue";
import type { LoginResult } from "@ingot/auth-core";
import { useAuthSession } from "../../../session";

export function usePasswordLogin() {
  const session = useAuthSession();
  const formModel = reactive({
    username: "",
    password: "",
  });
  const loading = ref(false);

  const init = (): void => {
    loading.value = false;
    formModel.username = "";
    formModel.password = "";
  };

  const handleLogin = (): Promise<LoginResult> => {
    loading.value = true;
    return session
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

  return {
    formModel,
    loading,
    init,
    handleLogin,
  };
}
