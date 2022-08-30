import React from "react";

import cs from "./blank_screen_message.scss";

interface BlankScreenMessageProps {
  icon: React.ReactNode;
  message: string;
  tagline: string | React.ReactNode;
  textWidth: number;
}

const BlankScreenMessage = ({
  icon,
  message,
  tagline,
  textWidth,
}: BlankScreenMessageProps) => (
  <div className={cs.blankScreenMessage}>
    <div className={cs.content}>
      <div className={cs.text} style={{ width: textWidth }}>
        <div className={cs.message}>{message}</div>
        <div className={cs.tagline}>{tagline}</div>
      </div>
      {icon}
    </div>
  </div>
);

export default BlankScreenMessage;
