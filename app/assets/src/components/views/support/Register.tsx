import React from "react";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import ConfirmationMessage from "./ConfirmationMessage";

const urlParser = new UrlQueryParser({ error: "string" });

const Register = () => {
  const { error } = urlParser.parse(location.search);

  return <ConfirmationMessage errorType={error} />;
};

export default Register;
