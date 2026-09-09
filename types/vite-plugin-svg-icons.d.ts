declare module "virtual:svg-icons-register";
declare module "virtual:iconify-offline";
declare module "virtual:ingot-iconify-icon" {
  import type { Component } from "vue";
  export const Icon: Component;
  export function loadIcon(name: string): Promise<{ body: string } | null>;
  export function getIcon(name: string): {
    body: string;
    width?: number;
    height?: number;
    left?: number;
    top?: number;
  } | null;
}
