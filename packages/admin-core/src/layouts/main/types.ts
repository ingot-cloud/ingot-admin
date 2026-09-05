import type { ComputedRef, InjectionKey, Ref } from "vue";
import type { InNavigationMode } from "@/components/types";

export const SHELL_BREAKPOINT_NARROW = 1024;
export const SHELL_BREAKPOINT_WIDE = 1280;

export interface ShellLayoutApi {
  navigationMode: ComputedRef<InNavigationMode>;
  isOverlay: ComputedRef<boolean>;
  overlayOpen: Ref<boolean>;
  sidebarExpanded: ComputedRef<boolean>;
  toggleSidebar: () => void;
  closeOverlay: () => void;
}

export const shellLayoutKey: InjectionKey<ShellLayoutApi> = Symbol("inShellLayout");
