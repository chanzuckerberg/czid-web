import { Link } from "@czi-sds/components";
import React from "react";
import IconBiohubSFLogoColor from "~/components/ui/icons/IconBiohubSFLogoColor";
import ImpactMap from "~/images/impact_page/ImpactMap.svg";
import IconCziLogoColor from "~/images/impact_page/logo-czi-color.png";
import IconGatesFoundationLogo from "~/images/impact_page/logo-gates-foundation.png";
import { ImpactCountryData } from "../ImpactCountryData";
import cs from "./ImpactIntro.scss";

interface ImpactIntroProps {
  setSelectedCountry: (country: (typeof ImpactCountryData)[0]) => void;
  selectedCountry: (typeof ImpactCountryData)[0];
}

export const ImpactIntro = (props: ImpactIntroProps) => {
  return (
    <div className={cs.introContainer}>
      <div className={cs.introTextWrap}>
        <h2>CZ ID Around the World</h2>
        <p>
          Together with the Bill & Melinda Gates Foundation through its Global
          Grand Challenges initiative, the{" "}
          <Link
            className={cs.introTextLink}
            href="https://chanzuckerberg.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chan Zuckerberg Initiative (CZI)
          </Link>{" "}
          and the{" "}
          <Link
            className={cs.introTextLink}
            href="https://www.czbiohub.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chan Zuckerberg Biohub (CZ Biohub)
          </Link>{" "}
          are partnering with researchers around the world to characterize
          pathogen landscapes and increase capacity for infectious disease
          research in low- to-middle income countries.
        </p>
        <p>
          In addition to providing funding to increase access to sequencing
          hardware and analysis tools, we also provide comprehensive, hands-on
          training to researchers across the globe. Our partnership has enabled
          local communities to identify unknown causes of disease and respond to
          outbreaks more rapidly and effectively.
        </p>
        <span>In partnership with</span>
        <div className={cs.logoLinkContainer}>
          {/* logo links here */}
          <a
            className={cs.logoLink}
            href="https://www.czbiohub.org/"
            target="_blank"
            rel="noreferrer"
          >
            <IconBiohubSFLogoColor />
          </a>
          <a
            className={cs.logoLink}
            href="https://chanzuckerberg.com/"
            target="_blank"
            rel="noreferrer"
          >
            <img src={IconCziLogoColor} alt="" />
          </a>
          <a
            className={cs.logoLink}
            href="https://www.gatesfoundation.org/"
            target="_blank"
            rel="noreferrer"
          >
            <img src={IconGatesFoundationLogo} alt="" />
          </a>
        </div>
      </div>
      <div className={cs.mapContainer}>
        <img className={cs.impactMap} src={ImpactMap} alt="" />
        {ImpactCountryData.map((country, index) => (
          <div
            key={`country-${index}`}
            className={`${cs.impactMapDot} ${
              country.cycle === 1 ? cs.cycle1 : cs.cycle2
            }`}
            onClick={() => {
              props.setSelectedCountry(ImpactCountryData[index]);
            }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                props.setSelectedCountry(ImpactCountryData[index]);
              }
            }}
            style={{
              bottom: `${country.mapPosition.bottom}`,
              left: `${country.mapPosition.left}`,
            }}
            role="button"
            tabIndex={0}
          >
            <span className={cs.impactMapDotLabel}>{country.countryName}</span>
          </div>
        ))}
        <div className={cs.impactMapLegend}>
          <div className={cs.impactMapLegendItem}>
            <span className={`${cs.impactMapDot} ${cs.cycle1}`}></span>
            <span className={cs.impactMapLegendText}>Cycle 1</span>
          </div>
          <div className={cs.impactMapLegendItem}>
            <span className={`${cs.impactMapDot} ${cs.cycle2}`}></span>
            <span className={cs.impactMapLegendText}>Cycle 2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
