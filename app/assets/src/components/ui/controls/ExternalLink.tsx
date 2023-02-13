import React from "react";

import Link, { LinkProps } from "./Link";

const ExternalLink = (props: LinkProps) => {
  return <Link external {...props} />;
};

export default ExternalLink;
