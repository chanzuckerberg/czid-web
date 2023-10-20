import React from "react";
import { NarrowContainer } from "~/components/layout";
import LoadingMessage from "../LoadingMessage";
import cs from "./loading_page.scss";

export const LoadingPage = () => {
  return (
    <NarrowContainer size="small">
      <LoadingMessage className={cs.loading} message="Loading..." />
    </NarrowContainer>
  );
};
