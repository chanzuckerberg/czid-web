import React from "react";

import Link, { LinkProps } from "./Link";

type ExternalLinkProps = Omit<LinkProps, "externalLink">;

const ExternalLink = (props: ExternalLinkProps) => {
  return <Link external {...props} />;
};

export default ExternalLink;
