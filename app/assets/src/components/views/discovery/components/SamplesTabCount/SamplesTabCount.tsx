import React, { ReactNode } from "react";

interface SamplesTabCountProps {
  count: ReactNode;
}

export const SamplesTabCount = (props: SamplesTabCountProps) => {
  return <>{props.count}</>;
};
