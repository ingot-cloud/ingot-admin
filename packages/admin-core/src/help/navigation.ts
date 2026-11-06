import { inject, type InjectionKey } from "vue";

/** 帮助只负责当前端导航；页面不传外部URL或目标管理域。 */
export interface HelpNavigation {
  openHome(): Promise<void>;
  openForView(viewPath: string): Promise<void>;
  openArticle(articleId: string): Promise<void>;
}

export const helpNavigationKey: InjectionKey<HelpNavigation> = Symbol("ingot.help.navigation");

/** 未装配帮助插件的宿主不显示无目标入口。 */
export function useHelpNavigation(): HelpNavigation | undefined {
  return inject(helpNavigationKey, undefined);
}
