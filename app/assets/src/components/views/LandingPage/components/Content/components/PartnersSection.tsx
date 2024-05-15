import React from "react";
import CardLogo from "~/images/landing_page/card.png";
import IlluminaLogo from "~/images/landing_page/illumina.png";
import MicrobiomDBLogo from "~/images/landing_page/microbiomDB.png";
import NanoporeLogo from "~/images/landing_page/nanopore.png";
import NextcladeLogo from "~/images/landing_page/nextclade.png";
import cs from "./PartnersSection.scss";

const PartnersSection = () => {
  return (
    <section className={cs.partnersSection__wrap}>
      <div className={cs.partnersSection}>
        <div className={cs.partnersSection__textBox}>
          <h2>We Work Closely with Trusted Partners</h2>
          <p>
            CZ ID collaborates with trusted partners in the bioinformatics,
            infectious disease, and sequencing ecosystem.
          </p>
        </div>
        <div className={cs.partnersSection__logoGrid}>
          <div className={cs.partnersSection__logoRow_top}>
            <img src={IlluminaLogo} alt="" />
            <img src={MicrobiomDBLogo} alt="" />
          </div>
          <div className={cs.partnersSection__logoRow_bottom}>
            <img src={NanoporeLogo} alt="" />
            <img src={NextcladeLogo} alt="" />
            <img src={CardLogo} alt="" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
