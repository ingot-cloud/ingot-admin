export type LoadGuard = {
  isCurrent: () => boolean;
};

export const createLoadGuard = (): { begin: () => LoadGuard } => {
  let seq = 0;
  return {
    begin(): LoadGuard {
      const token = ++seq;
      return {
        isCurrent: () => token === seq,
      };
    },
  };
};
