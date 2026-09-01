import { isVNode, shallowRef } from "vue";
import { flattedChildren } from "@/utils/vnode";

import type { Component, ComponentInternalInstance, VNode } from "vue";

type ChildEssential = {
  uid: number;
  getVnode: () => VNode;
};

const getOrderedChildren = <T>(
  vm: ComponentInternalInstance,
  childComponentName: string,
  children: Record<number, T>,
): T[] => {
  const nodes = flattedChildren(vm.subTree).filter(
    (n): n is VNode =>
      isVNode(n) && (n.type as Component)?.name === childComponentName && !!n.component,
  );
  const uids = nodes.map((n) => n.component!.uid);
  return uids.map((uid) => children[uid]).filter((p) => !!p);
};

export const useOrderedChildren = <T extends ChildEssential>(
  vm: ComponentInternalInstance,
  childComponentName: string,
) => {
  const children: Record<number, T> = {};
  const orderedChildren = shallowRef<T[]>([]);

  const addChild = (child: T) => {
    children[child.uid] = child;
    orderedChildren.value = getOrderedChildren(vm, childComponentName, children);
  };
  const removeChild = (uid: number) => {
    delete children[uid];
    orderedChildren.value = orderedChildren.value.filter((children) => children.uid !== uid);
  };

  return {
    children: orderedChildren,
    addChild,
    removeChild,
  };
};
