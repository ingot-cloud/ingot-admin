import { createRouter, createWebHistory } from "vue-router";
import { hasNullParameter } from "@/utils/requiredParameters";
import { useLoginStore } from "@/stores/modules/login";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/oauth2/challenge",
    },
    {
      path: "/oauth2/challenge",
      beforeEnter: (to) => {
        const query = to.query;
        const nullKey = hasNullParameter(query);
        if (nullKey) {
          return {
            path: "/errors",
            query: {
              errorMsg: `参数无效：${nullKey} is blank`,
              redirect_uri: query.redirect_uri,
            },
          };
        }
        // 装载参数
        const loginStore = useLoginStore();
        loginStore.set(query);
        return new Promise((resolve) => {
          loginStore
            .sessionAuthorize()
            .then(() => {
              resolve(true);
            })
            .catch(() => {
              resolve(true);
            });
        });
      },
      component: () => import("@/pages/oauth2/challenge/IndexPage.vue"),
    },
    {
      path: "/errors",
      component: () => import("@/pages/errors/IndexPage.vue"),
    },
  ],
});

export default router;
