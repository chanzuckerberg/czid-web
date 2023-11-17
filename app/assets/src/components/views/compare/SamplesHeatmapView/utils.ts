export const throttle = (callbackFn, limit: number) => {
  let wait = false;
  return function() {
    if (!wait) {
      callbackFn.call();
      wait = true;
      setTimeout(function() {
        wait = false;
      }, limit);
    }
  };
};

export const getTruncatedLabel = (label: string) => {
  return label.length > 20
    ? `${label.slice(0, 9)}...${label.slice(-7)}`
    : label;
};
