import type { RequiredParameters } from "../types";
import type { LocationQuery } from "vue-router";
import { PreAuthorizeAPI, AuthorizeAPI, SessionAuthorizeAPI } from "@/api/challenge";
import type { PreAuthorizeResult } from "@/models";

export const useLoginStore = defineStore("app.login", () => {
  const requiredParameters = reactive<RequiredParameters>({});
  const preGrantType = ref("password");
  const preAuthorizeResult = ref<PreAuthorizeResult | undefined>(undefined);

  const getPreAuthorizeResult = computed(() => {
    return preAuthorizeResult.value;
  });

  const changePreGrantType = (value: string) => {
    preGrantType.value = value;
  };

  const set = (query: LocationQuery) => {
    requiredParameters.client_id = query.client_id as string;
    requiredParameters.code_challenge = query.code_challenge as string;
    requiredParameters.response_type = query.response_type as string;
    requiredParameters.redirect_uri = query.redirect_uri as string;
    requiredParameters.scope = query.scope as string;
    if (query.state) {
      requiredParameters.state = query.state as string;
    }
  };

  /**
   * 预授权接口
   */
  const preAuthorize = ({
    username,
    password,
    code,
  }: {
    username: string;
    password: string;
    code?: string;
  }): Promise<PreAuthorizeResult> => {
    return new Promise((resolve, reject) => {
      preAuthorizeResult.value = undefined;
      PreAuthorizeAPI({
        username,
        password,
        code,
      })
        .then((response) => {
          preAuthorizeResult.value = response.data;
          resolve(response.data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  const authorizeCodeRequest = (tenant: string) => {
    return new Promise((resolve, reject) => {
      AuthorizeAPI(tenant)
        .then((response) => {
          const data = response.data;
          window.location.href = `${data.redirect_uri}?code=${data.code}&state=${data.state}`;
          resolve(response.data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  const sessionAuthorize = () => {
    return new Promise((resolve, reject) => {
      preAuthorizeResult.value = undefined;
      SessionAuthorizeAPI()
        .then((response) => {
          preAuthorizeResult.value = response.data;
          resolve(response.data);
        })
        .catch(() => {
          reject();
        });
    });
  };
  return {
    requiredParameters,
    preGrantType,
    preAuthorizeResult,
    getPreAuthorizeResult,
    changePreGrantType,
    set,
    authorizeCodeRequest,
    preAuthorize,
    sessionAuthorize,
  };
});
