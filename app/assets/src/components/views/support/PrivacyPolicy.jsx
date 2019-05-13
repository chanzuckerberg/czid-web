import React from "react";
import { NarrowContainer } from "~/components/layout";
import cs from "./support.scss";

export default class PrivacyPolicy extends React.Component {
  render() {
    return (
      <NarrowContainer className={cs.privacyPolicy} size="small">
        <div className={cs.title}>
          <h1>IDseq Data Privacy Notice</h1>
          <h4 className={cs.subtitle}>
            Last Updated: <a href="">May 10, 2019</a>. <a href="">FAQ</a>.
          </h4>
        </div>
        <p className={cs.large}>
          The Chan Zuckerberg Biohub Inc. (“<b>CZ Biohub</b>,” “<b>we</b>,” “<b>
            us
          </b>,” or “<b>our</b>”) provides the IDseq platform (“<b>Services</b>”
          or “<b>IDseq</b>”) in partnership with the Chan Zuckerberg Initiative,
          LLC (“CZI”). This Data Privacy Notice (“<b>Privacy Notice</b>”)
          describes the types of information we collect or that is uploaded by
          website visitors (“<b>Visitors</b>”) and registered users (“<b>
            Users
          </b>”), and how we use, share, and protect that information. See our{" "}
          <a href="">FAQ</a>, which has useful information about IDSeq, and for
          more information about our data practices, the IDseq service and the{" "}
          <a href="">Terms of Use</a> (“<b>Terms</b>”) that applies to your
          access and use of IDseq.
        </p>
        <h3>About IDseq</h3>
        <p className={cs.large}>
          IDseq is an online platform designed to enable the research community
          to research pathogens in metagenomic sequencing and to help further
          the study of infectious diseases. To do this, IDseq processes genetic
          data in order to identify pathogens contained within.
        </p>
        <p className={cs.large}>
          <b>Here’s how IDseq works</b>: Users submit Upload Data (as described
          below). This data may contain human and non-human genetic sequences (“<b
          >
            Sample Data
          </b>”; as further defined below), as well as information about those
          sequences, such as the date the sample was collected and the species
          it was collected from (“<b>Sample Metadata</b>” as further defined
          below). For example, a researcher might upload genetic information
          from mosquitoes, which are often a source of infectious disease, or
          from humans, who can be infected by such diseases. IDseq then
          processes this Upload Data in order to identify pathogens found within
          the genetic sequence (e.g., the mosquito may be carrying the
          chikungunya virus).
        </p>
        <p className={cs.large}>
          We hope that this sharing of pathogen data will help to create a
          global dashboard that helps researchers better understand pathogens.
        </p>
        <p className={cs.large}>
          IDseq also collects information about Users in order to offer the
          Service. Other than basic information required to create an account
          (e.g. email address, name), the User determines what information they
          want to upload onto IDseq. Please note: IDseq is not designed for or
          directed toward children under the age of sixteen.
        </p>
        <h2>
          <span className={cs.number}>1.</span>Upload Data.
        </h2>
        <p className={cs.large}>
          “<b>Upload Data</b>” is data that Users upload to IDseq (other than
          the information Users provide during registration to create an
          account). As explained below, Upload Data consists of genetic sequence
          information (human or non-human) and metadata about those genetic
          sequences (such as time and location of sample collection).
        </p>
        <p className={cs.large}>
          As described in our Terms, Users are required to obtain and maintain
          all necessary consents, permissions, and authorizations required by
          applicable laws prior to uploading, sharing, and exporting Upload Data
          with the Services.
        </p>
        <p className={cs.large}>
          <div className={cs.underlineHeader}>What Is Upload Data?</div>
        </p>
        <p className={cs.large}>
          Upload Data includes Sample Data and Sample Metadata.
        </p>
        <ul>
          <li>
            <span className={cs.listItemLabel}>Sample Data:</span>
            “<b>Sample Data</b>” is full genetic sequence data uploaded by
            Users. Genetic sequence data contains genetic information about
            pathogens in the sample and of the host from which the sample was
            taken. The host could be a human or non-human (e.g., mosquito). You
            should not be able to find any human sequence data in IDseq other
            than those embedded in samples you yourself have uploaded. This is
            because we filter out and discard host sequence data in order to
            generate Reports. If you are able to find human sequence data
            elsewhere in IDseq, please let us know at privacy@idseq.net and we
            will address it.
          </li>
          <li>
            <span className={cs.listItemLabel}>Sample Metadata:</span>
            “<b>Sample Metadata</b>” includes information related to the Sample
            Data, such as the host type (e.g., human or mosquito), upload date,
            and tissue type and free-text research notes entered by Users. This
            data <u>should not</u> include personally-identifying information
            regarding the individual to whom the Sample Data relates.
          </li>
        </ul>
        <p className={cs.large}>
          <div className={cs.underlineHeader}>How We Use Upload Data</div>
        </p>
        <p className={cs.large}>
          Upload Data is used for the following purposes:
          <ul>
            <li>
              To create Report Data (described below), including new reports for
              Users when we update our Data Pipeline.
            </li>
            <li>
              To improve the way IDseq creates Report Data, including improving
              our Data Pipeline.
            </li>
          </ul>
          <b>
            We never sell your data, including your personally identifiable
            information (“personal data”).
          </b>
        </p>
        <p className={cs.large}>
          <div className={cs.underlineHeader}>How We Share Upload Data</div>
        </p>
        <p className={cs.large}>
          Sample Data and Sample Metadata are shared back to the Users that
          uploaded the data, as well as other IDseq users with whom they
          expressly choose to share that information. Users can share the Sample
          Data and Metadata they submit by creating Projects (groups of Samples
          and Reports) and sharing those Projects with other IDseq users, who
          will then be able to see and download the Sample Data that was shared
          with them.
        </p>
        <p className={cs.large}>
          Please note that in order to advance IDseq’s goal of creating a global
          pathogen dashboard for researchers, Sample Metadata and Report Data
          (described below) will be made available to Users outside of a
          Project.{" "}
          <b>
            That is, any User of IDseq will be able to see your Sample Metadata
            and Report Data unless you take action to delete your Upload Data
            before the one year anniversary of upload.
          </b>{" "}
          Even after Metadata and Report Data are made available to all Users,
          your Sample Data will continue to remain available only to you and
          anyone you have decided to share it with.
        </p>
        <p className={cs.large}>
          Sample Data and Metadata is also shared as described in the section on
          Partners, Vendors, and Other Third Parties below.
        </p>
        <p className={cs.large}>
          <div className={cs.underlineHeader}>
            What’s our legal basis to use and share Upload Data?
          </div>
        </p>
        <p className={cs.large}>
          To the extent that the European Union’s General Data Protection
          Regulation (“GDPR”) applies, we rely on the following legal bases to
          use and share personal data within Upload Data:
        </p>
        <ul>
          <li>
            The explicit consent of the individual whose data is being analyzed,
            where such consent has been obtained by the User in accordance with
            the GDPR; and
          </li>
          <li>
            The public interest and our and our Users’ legitimate interest in
            investigating and stopping the spread of infectious diseases and
            promoting global health. The use and sharing of personal data within
            Upload Data furthers the public interest in the area of public
            health, particularly by helping to protect against serious
            cross-border threats to health. The processing of personal data
            within Upload Data is also necessary for scientific research
            purposes.
          </li>
        </ul>
        <h2>
          <span className={cs.number}>2.</span>Report Data.
        </h2>
        <p className={cs.large}>
          Report Data is information IDseq produced from Upload Data. We
          generate Report Data by processing Upload Data through our Data
          Pipeline. The “<b>Data Pipeline</b>” cleans (e.g., by removing
          duplicate nucleotides) and analyzes (e.g., by matching Sample Data
          nucleotide sequences with known pathogen sequences) the Upload Data.
          Report Data may include, for example, data about the pathogen
          sequences identified in the Sample Data and the frequency of such
          identification (“<b>Pathogen Data</b>”) or raw numeric counts of
          non-personally identifying gene expression profiles that were found in
          the Sample Data (“<b>Gene Counts</b>”).
        </p>
        <p className={cs.large}>
          Once Sample Data has been put through the Data Pipeline, the Report
          Data that is produced no longer includes any human genetic sequence
          data, and is not personal data, and does not, on its own, permit
          association with any specific individual. You should not be able to
          find any human sequence data in IDseq other than those embedded in
          samples you yourself have uploaded. This is because we filter out and
          remove host sequence data in order to generate Reports. If you are
          able to find human sequence data elsewhere in IDseq, please let us
          know at privacy@idseq.net and we will address it.
        </p>
        <p className={cs.large}>
          <div className={cs.underlineHeader}>Who can see Report Data?</div>
        </p>
        <p className={cs.large}>
          After 1 year from upload of originating Sample Data, Report Data is
          visible to all IDseq Users, and they may share it with others beyond
          IDseq.
        </p>
        <h2>
          <span className={cs.number}>3.</span>Visitor and User Data.
        </h2>
        <p className={cs.large}>
          Visitor and User Data is the information we collect from you and your
          use of IDseq.
        </p>
        <p className={cs.large}>
          <div className={cs.underlineHeader}>What We Collect</div>
        </p>
        <ul>
          <li>
            <span className={cs.listItemLabel}>Visitor Data.</span>
            This is information collected from visitors to our website, whether
            or not they are Users (“<b>Visitor Data</b>”).
          </li>
          <li>
            <span className={cs.listItemLabel}>User Data.</span>
            User Data is any information we collect from a User about that User
            (“<b>User Data</b>”). It may include information necessary to create
            or access your account such as your name, username, email address,
            and login credentials.
          </li>
          <li>
            When Visitors and Users visit or use our Service, we may
            automatically collect Device Data or Analytics Information. “<b>
              Device Data
            </b>” includes information about your browser type and operating
            system, IP address and/or device ID, including basic analytics from
            your device or browser. “<b>Analytics Information</b>” relates to
            any of your requests, queries, or use of the Services, such as the
            amount of time spent viewing particular web pages. We use{" "}
            <a href="">Google Analytics</a> for this service. Visitor Data may
            also include information we collect about you when you visit our
            website or use the Services, including through the use of cookies,
            web beacons, and other technologies.
          </li>
          <li>
            <span className={cs.listItemLabel}>
              Cookies, Web Beacons, and other Technologies.
            </span>
            A cookie is a small file that may be stored on your computer or
            other device. Web beacons and similar technologies are small bits of
            code embedded in web pages, ads, and email that communicate with
            third parties. We use these technologies to recognize your device
            and browser and do things such as keep you logged in or to
            understand usage patterns by Users and Visitors to our Services. We
            do not use cookies to service third party ads. For more information
            about our cookies use, please see our <a href="">FAQ</a>.
          </li>
        </ul>
      </NarrowContainer>
    );
  }
}
