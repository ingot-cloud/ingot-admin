import { fixtureAuroraTheme } from "@ingot/theme-fixture-aurora";
import "@ingot/theme-fixture-aurora/style.css";

const root = document.querySelector("#app");
if (root) {
  root.textContent = fixtureAuroraTheme.id;
}
