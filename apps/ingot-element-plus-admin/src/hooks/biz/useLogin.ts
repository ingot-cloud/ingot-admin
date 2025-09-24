import { useAppStore } from "@/stores/modules/app";
import { useLoginStore } from "@/stores/modules/login";

export const useLogin = () => {
  const go = async () => {
    const { app } = useAppStore();
    const { generateState, generatePkce } = useLoginStore();
    const pkce = await generatePkce();
    const state = generateState();

    const uri =
      `${app.login.loginUri}` +
      `?client_id=${app.login.clientId}` +
      `&response_type=code` +
      `&redirect_uri=${app.login.loginCallbackUri}` +
      `&scope=${app.login.scope}` +
      `&state=${state}` +
      `&code_challenge=${pkce.code_challenge}`;

    window.location.href = uri;
  };

  return {
    go,
  };
};
