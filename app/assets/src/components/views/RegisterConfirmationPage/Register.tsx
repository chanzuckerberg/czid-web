import React from "react";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import { ConfirmationMessage } from "../../common/ConfirmationMessage";

const urlParser = new UrlQueryParser({ error: "string" });

export const Register = () => {
  const { error } = urlParser.parse(location.search);

  return <ConfirmationMessage errorType={error} />;
};
