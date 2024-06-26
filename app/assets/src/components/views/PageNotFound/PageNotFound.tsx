import React from "react";
import { InfoBanner } from "~/components/common/InfoBanner";
import ImgMicrobeSecondary from "~/components/ui/illustrations/ImgMicrobeSecondary";
import { LandingHeaderV1 } from "./components/LandingHeaderV1";
import cs from "./page_not_found.scss";

interface PageNotFoundProps {
  browserInfo?: {
    supported: boolean;
    browser: string;
  };
  showLandingHeader?: boolean;
}

export const PageNotFound = ({
  browserInfo,
  showLandingHeader,
}: PageNotFoundProps) => {
  return (
    <div>
      {showLandingHeader && <LandingHeaderV1 browserInfo={browserInfo} />}
      <div className={cs.bannerContainer}>
        <InfoBanner
          icon={<ImgMicrobeSecondary />}
          link={{
            href: "/",
            text: "Go to CZ ID home",
          }}
          message="This link might be broken or permissions might have been changed."
          title="Oh no! This page isn't available."
          type="page_not_found"
        />
      </div>
    </div>
  );
};
