import { reactive, ref } from "vue";
import type { LoginResult } from "@ingot/auth-core";
export function usePasswordLogin(
  submit: (username: string, password: string) => Promise<LoginResult>,
) {
  const formModel = reactive({ username: "", password: "" });
  const loading = ref(false);
  const init = (): void => {
    loading.value = false;
    formModel.username = "";
    formModel.password = "";
  };
  const handleLogin = async (): Promise<LoginResult> => {
    loading.value = true;
    try {
      return await submit(formModel.username, formModel.password);
    } finally {
      loading.value = false;
    }
  };
  return { formModel, loading, init, handleLogin };
}
