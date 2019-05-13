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
        <h3>1. Upload Data</h3>
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
          <div>
            <u>What Is Upload Data?</u>
          </div>
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
          <div>
            <u>How We Use Upload Data</u>
          </div>
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
          <div>
            <u>How We Share Upload Data</u>
          </div>
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
      </NarrowContainer>
    );
  }
}
