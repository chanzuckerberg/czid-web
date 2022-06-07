import React from "react";

import Link from "./Link";

const ExternalLink = (props: ExternalLinkProps) => {
  return <Link external {...props} />;
};

interface ExternalLinkProps {
  analyticsEventData: object;
  analyticsEventName: string;
  coloredBackground: boolean;
  children: React.ReactNode;
  className: string;
  href: string;
  onClick: $TSFixMeFunction;
}

export default ExternalLink;
