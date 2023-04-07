import React from "react";
import cs from "./wikipedia_license.scss";

interface WikipediaLicenseProps {
  taxonName: string;
  wikiUrl: string;
}

export const WikipediaLicense = ({
  taxonName,
  wikiUrl,
}: WikipediaLicenseProps) => {
  return (
    <div className={cs.wikiLicense}>
      This article uses material from the Wikipedia article{" "}
      <a href={wikiUrl} className={cs.wikiLink}>
        {taxonName}
      </a>
      , which is released under the{" "}
      <a
        href="https://creativecommons.org/licenses/by-sa/3.0/"
        className={cs.wikiLink}>
        Creative Commons Attribution-Share-Alike License 3.0
      </a>
      .
    </div>
  );
};
