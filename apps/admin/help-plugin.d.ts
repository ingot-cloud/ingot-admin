import type { InAdminPlugin } from "@ingot/admin-core";
import type {
  HelpContentProvider,
  HelpContentDefinition,
  HelpContentSources,
} from "../../plugins/help/src/content/types";

export declare function createHelpPlugin(options: {
  entry: "tenant" | "platform";
  loadContent: () => Promise<HelpContentProvider>;
}): InAdminPlugin;
export declare function createStaticHelpProvider(
  definition: HelpContentDefinition,
): HelpContentProvider;
export declare const commonHelpContent: HelpContentSources;
export type { HelpContentProvider, HelpContentDefinition, HelpContentSources };
export { useHelpNavigation } from "@ingot/admin-core";
