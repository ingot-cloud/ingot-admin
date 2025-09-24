import pkceChallenge from "@/utils/pkce-challenge";
import { random } from "@/utils/pkce-challenge";

export const useLoginStore = defineStore(
  "login",
  () => {
    const state = ref("");
    const codeChallenge = ref("");
    const codeVerifier = ref("");

    const generateState = () => {
      state.value = random(6);
      return state.value;
    };

    const generatePkce = async () => {
      const pkce = await pkceChallenge();
      codeChallenge.value = pkce.code_challenge;
      codeVerifier.value = pkce.code_verifier;
      return pkce;
    };

    return {
      state,
      codeChallenge,
      codeVerifier,
      generateState,
      generatePkce,
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ["state", "codeVerifier"],
    },
  },
);
