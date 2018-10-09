import LoadingIcon from "../icons/LoadingIcon";
import PropTypes from "prop-types";
import React from "react";
import { Label } from "semantic-ui-react";

const LoadingLabel = ({ text }) => {
  return (
    <Label className="idseq-ui loading">
      <LoadingIcon /> {text || "Loading data..."}
    </Label>
  );
};

LoadingLabel.propTypes = {
  text: PropTypes.string
};

export default LoadingLabel;
