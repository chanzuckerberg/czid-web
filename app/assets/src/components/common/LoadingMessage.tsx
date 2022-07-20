import cx from "classnames";
import React from "react";

import { IconLoading } from "~ui/icons";

import cs from "./loading_message.scss";

interface LoadingMessageProps {
  className?: string,
  message?: string
}

const LoadingMessage = ({ className, message }: LoadingMessageProps) => (
  <div className={cx(cs.loadingMessage, className)}>
    <IconLoading className={cs.loadingIcon} />
    <div className={cs.text}>{message}</div>
  </div>
);

export default LoadingMessage;
