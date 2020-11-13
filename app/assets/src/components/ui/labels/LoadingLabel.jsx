import { IconLoading } from "../icons";
import PropTypes from "prop-types";
import React from "react";
import { Label } from "semantic-ui-react";

const LoadingLabel = ({ text }) => {
  return (
    <Label className="idseq-ui loading">
      <IconLoading /> {text || "Loading data..."}
    </Label>
  );
};

LoadingLabel.propTypes = {
  text: PropTypes.string,
};

export default LoadingLabel;
