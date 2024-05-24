import React, { ReactNode } from "react";

interface ConsensusGenomesTabCountProps {
  count: ReactNode;
}

export const ConsensusGenomesTabCount = (
  props: ConsensusGenomesTabCountProps,
) => {
  return <>{props.count}</>;
};
