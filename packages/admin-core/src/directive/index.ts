import {
  authAllDirective,
  authAnyDirective,
  authDirective,
} from "./authDirective";
import { wavesDirective } from "./wavesDirective";

export const coreDirectives = {
  auth: authDirective,
  "auth-any": authAnyDirective,
  "auth-all": authAllDirective,
  waves: wavesDirective,
};
