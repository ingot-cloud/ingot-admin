import { computed } from "vue";
import { useCapabilities } from "@ingot/admin-core";
import { CLIENT_QUERY_PERMISSION } from "./constants";
export const useCanQueryClient = () => {
  const { hasAction } = useCapabilities();
  return { canQueryClient: computed(() => hasAction(CLIENT_QUERY_PERMISSION)) };
};
