import { provideAuthSession } from "@ingot/auth-plugin";
import { useAppStore } from "@/stores/modules/app";
import { useLoginStore } from "@/stores/modules/login";
import { restartIfTransactionExpired } from "@/net/failure";
import { Message } from "@/utils/message";
import logoUrl from "@/assets/logo.png";

export function setupAuthSession(): void {
  const app = useAppStore();
  const login = useLoginStore();
  provideAuthSession({
    includeTenantSelect: login.authEntry !== "platform",
    appearance: app.login,
    logoUrl,
    startUrl: import.meta.env.VITE_APP_ADMIN_START_URL ?? "",
    restoreTransaction: login.restoreTransaction,
    preAuthorize: login.preAuthorize,
    selectTenant: login.selectTenant,
    followReady: login.followReady,
    restartIfExpired: restartIfTransactionExpired,
    warn: (message) => Message.warning(message),
  });
}
