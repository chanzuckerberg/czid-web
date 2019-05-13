import React from "react";
import { NarrowContainer } from "~/components/layout";
import cs from "./support.scss";

export default class TermsOfUse extends React.Component {
  render() {
    return (
      // TODO: Fill in all links.
      <NarrowContainer className={cs.termsOfUse} size="small">
        <div className={cs.title}>
          <h1>Terms of Use</h1>
          <h4 className={cs.subtitle}>
            Last Updated: <a href="">May 10, 2019</a>. <a href="">FAQ</a>.
          </h4>
        </div>
        <p className={cs.large}>
          Please read these Terms of Use (<span className={cs.quoteBold}>
            Terms
          </span>) before using IDseq (<span className={cs.quoteBold}>
            Services
          </span>{" "}
          or <span className={cs.quoteBold}>IDseq</span>). These Terms are
          entered into between the Chan Zuckerberg Biohub, Inc. (<span
            className={cs.quoteBold}
          >
            CZ Biohub
          </span>, <span className={cs.quoteBold}>we</span>,{" "}
          <span className={cs.quoteBold}>us</span> or{" "}
          <span className={cs.quoteBold}>our</span>) and you (<span
            className={cs.quoteBold}
          >
            User
          </span>{" "}
          or
          <span className={cs.quoteBold}>you</span>) and govern your use of
          IDseq. IDseq is comprised of our research portal, any associated
          online services or platforms that link to or refer to these Terms, and
          any databases or data accessible through the portal, associated
          services or platforms. IDseq is designed to enable the research
          community to investigate pathogens using metagenomic sequencing data
          and to help further the study of infectious diseases.
        </p>
        <p className={cs.large}>
          Please carefully read these terms and indicate your acceptance by
          registering for IDseq. If you do not agree to these Terms, do not
          register for an account or use IDseq and do not use it. For more
          information about our privacy practices, please see the{" "}
          <span className={cs.quoteBold}>
            <a href="">Privacy Notice</a>
          </span>).
        </p>
        <h3>About IDseq</h3>
        <p className={cs.large}>
          IDseq is an online platform designed to enable the research community
          to research pathogens in metagenomic sequencing and to help further
          the study of infectious diseases. To do this, IDseq processes genetic
          data in order to identify pathogens contained within.
        </p>
        <p className={cs.large}>
          <b>Here&#39;s how IDseq works</b>: Users submit Upload Data (as
          described below). This data may contain human and non-human genetic
          sequences (<q>
            <b>Sample Data</b>
          </q>; as further defined below), as well as information about those
          sequences, such as the date the sample was collected and the species
          it was collected from (<span className={cs.quoteBold}>
            Sample Metadata
          </span>{" "}
          as further defined below). For example, a researcher might upload
          genetic information from mosquitoes, which are often a source of
          infectious disease, or from humans, who can be infected by such
          diseases. IDseq then processes this Upload Data in order to identify
          pathogens found within the genetic sequence (e.g., the mosquito may be
          carrying the chikungunya virus).
        </p>
        <p className={cs.large}>
          <span className={cs.quoteBold}>Upload Data</span> is data that Users
          upload to IDseq (other than the information Users provide during
          registration to create an account). Upload Data consists of genetic
          sequence information (human or non-human) and metadata about those
          genetic sequences (such as time and location of sample collection).
          Upload Data includes Sample Data and Sample Metadata.
        </p>
        <p className={cs.large}>
          <span className={cs.quoteBold}>Sample Data</span> is full genetic
          sequence data uploaded by Users. Genetic sequence data contains
          genetic information about pathogens in the sample and of the host from
          which the sample was taken. The host could be a human or non-human
          (e.g., mosquito). You should not be able to find any human sequence
          data in IDseq other than those embedded in samples you yourself have
          uploaded. This is because we filter out and discard host sequence data
          in order to generate Reports.
        </p>
        <p className={cs.large}>
          <span className={cs.quoteBold}>Sample Metadata</span> includes
          information related to the Sample Data, such as the host type (e.g.,
          human or mosquito), upload date, and tissue type and free-text
          research notes entered by Users. This data <u>should not</u> include
          personally-identifying information regarding the individual to whom
          the Sample Data relates.
        </p>
        <p className={cs.large}>
          <span className={cs.quoteBold}>Report Data</span> is information IDseq
          produced from Upload Data. We generate Report Data by processing
          Upload Data through our Data Pipeline. IDseq’s{" "}
          <span className={cs.quoteBold}>Data Pipeline</span> cleans (e.g., by
          removing duplicate nucleotides) and analyzes (e.g., by matching Sample
          Data nucleotide sequences with known pathogen sequences) the Upload
          Data. Report Data may include, for example, data about the pathogen
          sequences identified in the Sample Data and the frequency of such
          identification (<span className={cs.quoteBold}>Pathogen Data</span>)
          or raw numeric counts of non-personally identifying gene expression
          profiles that were found in the Sample Data (<span
            className={cs.quoteBold}
          >
            Gene Counts
          </span>).
        </p>
        <p className={cs.large}>
          <span className={cs.quoteBold}>Database</span> refers to both the data
          and database(s) of IDseq.
        </p>

        <h3>Summary of Key Things to Know (see FAQ for more)</h3>
        <ul>
          <li>
            <span className={cs.listItemLabel}>
              IDseq does not provide medical advice.
            </span>
            The output from IDseq does not constitute and should not be relied
            upon to provide medical advice, diagnosis or treatment.{" "}
            <b>
              It is intended for research, educational, or informational
              purposes only.
            </b>
          </li>
          <li>
            <span className={cs.listItemLabel}>
              You must ensure that all personally-identifying information and
              Protected Health Information is fully removed from Sample Metadata
              before it is uploaded to IDseq.
            </span>
          </li>
          <li>
            <span className={cs.listItemLabel}>
              You are responsible for obtaining the permissions necessary to
              collect and submit the Upload Data.
            </span>
            You represent that you have obtained, and will maintain, all
            consents, permissions, and authorizations needed to collect, share,
            and export Upload Data with IDseq, and for IDseq to use and share
            the information as described in its Privacy Notice.
          </li>
          <li>
            <span className={cs.listItemLabel}>
              You may not attempt to re-identify Upload Data.
            </span>
            By using IDseq, you agree that you will not attempt to re-identify
            any Upload Data with a person, and you will not disclose any Upload
            Data of other Users downloaded from the Database except for the
            limited purposes described in these Terms.
          </li>
        </ul>
        <h2>
          <span className={cs.number}>1.</span>Upload and Report Data
        </h2>
        <ul>
          <li>
            <span className={cs.listItemLabel}>
              1.1 Use of Your Upload Data.
            </span>
            We need limited rights to your Upload Data solely in order to offer
            IDseq for you and other Users. Specifically, you grant to us a
            worldwide, non-exclusive, royalty-free, transferable (in accordance
            with Section 9.2 below), perpetual and irrevocable (except as set
            forth herein), license (with the right to grant further licenses) to
            use, reproduce, distribute, display, and create derivative works
            (e.g. phylogenetic trees) from Upload Data in connection with
            providing, developing and improving IDseq. You may request deletion
            of your Upload Data from IDseq by emailing privacy@idseq.net and
            including a description of your Upload Data that you wish to have
            removed. We will delete the requested Upload Data within 60 days of
            your request. Please note, that our removal from IDseq will not
            impact any use of Upload Data by others you may have chosen to share
            it with prior to the effective date of removal and we are not able
            to require others Users to stop using Upload Data they accessed or
            downloaded prior to removal. More information about Upload Data can
            be found in our <a href="">Privacy Notice</a>.
          </li>
          <li>
            <span className={cs.listItemLabel}>
              1.2 Use and Visibility of Your Report Data.
            </span>
            You understand that your Report Data is data generated by IDseq,
            does not contain personally-identifying information (i.e. personal
            data) and may be shared with other IDseq Users in order to further
            IDseq&#39;s mission and advance the study of infectious diseases.
          </li>
          <li>
            <span className={cs.listItemLabel}>1.3</span>
            You represent and warrant to us and our service partners that (A)
            your provision of the Upload Data to IDseq complies with all
            applicable laws, rules, and regulations, including the Nagoya
            Protocol and relevant export laws (<span className={cs.quoteBold}>
              Applicable Law
            </span>) and industry guidelines and ethical standards that apply to
            you (e.g. CIOMS or GA4GH) (<span className={cs.quoteBold}>
              Applicable Standards
            </span>), and you will otherwise comply with all Applicable Law in
            connection with IDseq; (B) you have all consents, permissions, and
            authorizations necessary and sufficient to provide and export the
            Upload Data to us for the purposes described in these Terms and in
            our <a href="">Privacy Notice</a> and to grant the rights and
            permissions herein; and (C) the Upload Data -- and our use of the
            Upload Data in accordance with these Terms and our{" "}
            <a href="">Privacy Notice</a> -- does not and will not violate
            Applicable Law or infringe or violate any third party rights.
          </li>
          <li>
            <span className={cs.listItemLabel}>1.4</span>
            TO THE EXTENT UPLOAD DATA IS OBTAINED FROM A HUMAN, YOU AGREE NOT TO
            PROVIDE UPLOAD DATA IN A FORM THAT CAN IDENTIFY (DIRECTLY OR
            INDIRECTLY TAKING INTO ACCOUNT ALL THE MEANS REASONABLY LIKELY TO BE
            USED) THE PERSON TO WHOM THE DATA RELATES OR THAT CONSTITUTES OR
            WOULD CONSTITUTE “PROTECTED HEALTH INFORMATION” OR REGULATED HEALTH
            INFORMATION UNDER APPLICABLE LAWS, SUCH AS THE U.S. HEALTH INSURANCE
            PORTABILITY AND ACCOUNTABILITY ACT (“HIPAA”). For example, the
            Upload Data shall not include any personal identifiers, including
            without limitation name, address, dates, telephone numbers, e-mail
            addresses, or medical health records.
          </li>

          <li>
            <span className={cs.listItemLabel} />
          </li>
          <li>
            <span className={cs.listItemLabel} />
          </li>
          <li>
            <span className={cs.listItemLabel} />
          </li>
        </ul>
      </NarrowContainer>
    );
  }
}
