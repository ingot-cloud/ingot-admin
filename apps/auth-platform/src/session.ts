import { provideAuthSession } from "@ingot/auth-plugin";
import { useAppStore } from "@/stores/modules/app";
import { useLoginStore } from "@/stores/modules/login";
import { restartIfTransactionExpired } from "@/net/failure";
import { Message } from "@/utils/message";
import logoUrl from "@ingot/appearance/assets/logo/in-light-framed.svg";
import logoDarkUrl from "@ingot/appearance/assets/logo/in-dark-framed.svg";

export function setupAuthSession(): void {
  const app = useAppStore();
  const login = useLoginStore();
  provideAuthSession({
    includeTenantSelect: login.authEntry !== "platform",
    appearance: app.login,
    logoUrl,
    logoDarkUrl,
    startUrl: import.meta.env.VITE_APP_ADMIN_START_URL ?? "",
    restoreTransaction: login.restoreTransaction,
    preAuthorize: login.preAuthorize,
    selectTenant: login.selectTenant,
    followReady: login.followReady,
    restartIfExpired: restartIfTransactionExpired,
    warn: (message) => Message.warning(message),
  });
}
