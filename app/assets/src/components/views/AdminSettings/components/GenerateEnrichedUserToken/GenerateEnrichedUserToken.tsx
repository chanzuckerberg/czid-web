import { Button, Callout, InputCheckbox, InputText } from "@czi-sds/components";
import React, { useState } from "react";
import { get } from "~/api/core";
import cs from "../../admin_settings.scss";

const fetchEnrichedUserTokenForAdmin = async (
  userId: string,
  includeHeaders: boolean,
) =>
  get("/enrich_token_for_admin", {
    params: { include_headers: includeHeaders, user_id: userId },
  });

export const GenerateEnrichedUserToken = () => {
  const [userId, setUserId] = useState<string>("");
  const [calloutIntent, setCalloutIntent] = useState<"success" | undefined>();
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);

  const handleButtonClick = async (userId: string) => {
    if (userId !== "") {
      const { token } = await fetchEnrichedUserTokenForAdmin(
        userId,
        includeHeaders,
      );
      if (token) {
        navigator.clipboard.writeText(token);
        setCalloutIntent("success");
      }
    }
  };

  return (
    <div className={cs.adminActionContainer}>
      <h1 className={cs.title}>Generate enriched user token</h1>
      <InputText
        sdsType="textField"
        label="User ID"
        id="userId"
        value={userId ?? ""}
        onChange={e => setUserId(e.target.value)}
      />
      <div>
        <InputCheckbox
          label="Include headers for GraphiQL"
          stage={includeHeaders ? "checked" : "unchecked"}
          onChange={() => setIncludeHeaders(!includeHeaders)}
        />
      </div>
      <Button
        onClick={() => handleButtonClick(userId)}
        sdsStyle="square"
        sdsType="primary"
        disabled={userId === ""}
      >
        Generate Token
      </Button>
      {calloutIntent && (
        <Callout intent={calloutIntent}>
          {`Successfully copied enriched user token for userId: ${userId} to clipboard!`}
        </Callout>
      )}
    </div>
  );
};
