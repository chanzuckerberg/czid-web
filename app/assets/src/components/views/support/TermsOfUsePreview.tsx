import { nanoid } from "nanoid";
import React from "react";
import { NarrowContainer } from "~/components/layout";
import List from "~/components/ui/List";
import cs from "./support.scss";

export default function TermsOfUsePreview() {
  const renderIntro = () => (
    <>
      <div className={cs.title}>
        <h1>Chan Zuckerberg ID (formerly IDseq) Terms of Use</h1>
        <h4 className={cs.subtitle}>
          Last Updated: January 1, 2023.{" "}
          <a href="/terms_changes">See Recent Changes</a>
        </h4>
      </div>
      <p className={cs.last}>
        <b>
          PLEASE BE ADVISED THAT THIS AGREEMENT CONTAINS AN ARBITRATION
          PROVISION IN SECTION 9 BELOW THAT AFFECTS YOUR RIGHTS UNDER THIS
          AGREEMENT.
        </b>{" "}
        EXCEPT FOR CERTAIN TYPES OF DISPUTES MENTIONED IN THAT PROVISION, YOU
        AND CZ BIOHUB (AND ITS PARTNERS AND AFFILIATES, INCLUDING WITHOUT
        LIMITATION CZI, LLC AND CZIF) AGREE THAT (1) DISPUTES BETWEEN US WILL BE
        RESOLVED BY INDIVIDUAL BINDING ARBITRATION, AND (2) YOU AND CZ BIOHUB
        (AND ITS PARTNERS AND AFFILIATES, INCLUDING WITHOUT LIMITATION CZI, LLC
        AND CZIF) WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS-ACTION LAWSUIT,
        CLASS-WIDE ARBITRATION, OR ANY OTHER REPRESENTATIVE ACTION.
      </p>
      <p>
        Please read these Terms of Use (“Terms”) before using Chan Zuckerberg ID
        (“Services” or “CZ ID”). These Terms are entered into between the Chan
        Zuckerberg Biohub, Inc. (“CZ Biohub”, “ we”, “us” or “our”) and you
        (“User” or “ you”) and govern your use of CZ ID. CZ ID is comprised of
        our research portal, any associated online services or platforms that
        link to or refer to these Terms, and any databases or data accessible
        through the portal, associated services or platforms. CZ ID is designed
        to enable the research community to investigate pathogens using
        metagenomic sequencing data and to help further the study of infectious
        diseases.
      </p>
      <p>
        Please carefully read these terms and indicate your acceptance by
        registering for CZ ID. If you do not agree to these Terms, do not
        register for an account or use CZ ID. For more information about our
        privacy practices, please see our <a href="/privacy">Privacy Notice</a>.
      </p>
    </>
  );

  const renderSummaryOfKeyThingsToKnow = () => {
    return (
      <>
        <h3>
          Summary of Key Things to Know (see <a href="/faqs">FAQ</a> for more)
        </h3>
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              CZ ID does not provide medical advice. The output from CZ ID does
              not constitute and should not be relied upon to provide medical
              advice, diagnosis or treatment. It is intended for research,
              educational, or informational purposes only.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              You must ensure that all personally-identifying information and
              Protected Health Information is fully removed from Sample Metadata
              before it is uploaded to CZ ID.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              You are responsible for obtaining the permissions necessary to
              collect and submit the Upload Data. You represent that you have
              obtained, and will maintain, all consents, permissions, and
              authorizations needed to collect, share, use, and export Upload
              Data within CZ ID, and for CZ ID to use and share the information
              as described in its <a href="/privacy">Privacy Notice</a>.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              You may not attempt to re-identify Upload Data. By using CZ ID,
              you agree that you will not attempt to re-identify any Upload Data
              with a person, and you will not disclose any Upload Data of other
              Users downloaded from the Database except for the limited purposes
              described in these Terms.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              CZ ID does not own any research outputs you create with your
              Report Data, such as consensus genomes and phylogenetic trees for
              pathogens of interest. This is your data and you control it.
            </React.Fragment>,
          ]}
        />
      </>
    );
  };

  const renderAboutCZID = () => {
    return (
      <>
        <h3>About CZ ID</h3>
        <p>
          Here’s how CZ ID works: Users submit Upload Data (as described below).
          This data may contain human and non-human genetic sequences (“Sample
          Data” as further defined below), as well as information about those
          sequences, such as the date the sample was collected and the species
          it was collected from (“Sample Metadata” as further defined below).
          For example, a researcher might upload genetic information from
          mosquitoes, which are often a source of infectious disease, or from
          humans, who can be infected by such diseases. CZ ID then processes
          this Upload Data in order to identify pathogens found within the
          genetic sequence (e.g., the mosquito may be carrying the chikungunya
          virus).
        </p>
        <p>
          “Upload Data” is data that Users upload to CZ ID (other than the
          information Users provide during registration to create an account).
          Upload Data consists of genetic sequence information (human or
          non-human) and metadata about those genetic sequences (such as time
          and location of sample collection). Upload Data includes Sample Data
          and Sample Metadata.
        </p>
        <p>
          “Sample Data” is full genetic sequence data uploaded by Users. Genetic
          sequence data contains genetic information about pathogens in the
          sample and of the host from which the sample was taken. The host could
          be a human or non-human (e.g., mosquito). You should not be able to
          find any human sequence data in CZ ID other than those embedded in
          samples you yourself have uploaded. This is because we filter out and
          discard host sequence data in order to generate Reports.
        </p>
        <p>
          “Sample Metadata” includes information related to the Sample Data,
          such as the host type (e.g., human or mosquito), upload date, and
          tissue type and free-text research notes entered by Users. This data{" "}
          <u>should not</u> include personally-identifying information regarding
          the individual to whom the Sample Data relates.
        </p>
        <p>
          “Report Data” is information CZ ID produced from Upload Data. We
          generate Report Data by processing Upload Data through our Data
          Pipeline. CZ ID’s “Data Pipeline” cleans (e.g., by removing duplicate
          nucleotides) and analyzes (e.g., by matching Sample Data nucleotide
          sequences with known pathogen sequences) the Upload Data. Report Data
          may include, for example, data about the pathogen sequences identified
          in the Sample Data and the frequency of such identification (“Pathogen
          Data”) or raw numeric counts of non-personally identifying gene
          expression profiles that were found in the Sample Data (“Gene
          Counts”).
        </p>
        <p>“Database” refers to both the data and database(s) of CZ ID.</p>
      </>
    );
  };

  const renderUploadAndReportDataTerms = () => (
    <>
      <h2>
        <span className={cs.number}>1.</span>Upload and Report Data.
      </h2>
      <List
        listItems={[
          <React.Fragment key={nanoid()}>
            1.1 Use of Your Upload Data. We need limited rights to your Upload
            Data solely in order to offer CZ ID for you and other Users.
            Specifically, you grant to us a worldwide, non-exclusive,
            royalty-free, transferable (in accordance with Section 9.2 below),
            perpetual and irrevocable (except as set forth herein), license
            (with the right to grant further licenses) to use, reproduce,
            distribute, display, and create derivative works (e.g. phylogenetic
            trees) from Upload Data in connection with providing, developing and
            improving CZ ID. You may request deletion of your Upload Data from
            CZ ID by emailing{" "}
            <a href="mailto:privacy@czid.org">privacy@czid.org</a> and including
            a description of your Upload Data that you wish to have removed. We
            will delete the requested Upload Data within the timelines set forth
            under applicable privacy laws. Please note, that our removal of your
            Upload Data from CZ ID will not impact any use of Upload Data by
            others you may have chosen to share it with prior to the effective
            date of removal and we are not able to require others Users to stop
            using Upload Data they accessed or downloaded prior to removal. More
            information about Upload Data can be found in our{" "}
            <a href="/privacy">Privacy Notice</a>.
          </React.Fragment>,
          <React.Fragment key={nanoid()}>
            1.2 Use and Visibility of Your Report Data. You understand that your
            Report Data is data generated by CZ ID, does not contain
            personally-identifying information (i.e. personal data) and may be
            shared with other CZ ID Users in order to further CZ ID’s mission
            and advance the study of infectious diseases.
          </React.Fragment>,
          <React.Fragment key={nanoid()}>
            1.3 You represent and warrant to us and our service partners that
            (A) your provision of the Upload Data to CZ ID complies with all
            applicable laws, rules, and regulations, including the Nagoya
            Protocol and relevant export laws (“Applicable Law”) and industry
            guidelines and ethical standards that apply to you (e.g. CIOMS or
            GA4GH) (“Applicable Standards”), and you will otherwise comply with
            all Applicable Law in connection with CZ ID; (B) you have all
            consents, permissions, and authorizations necessary and sufficient
            to upload, share, use, and export the Upload Data to us for the
            purposes described in these Terms and in our{" "}
            <a href="/privacy">Privacy Notice</a> and to grant the rights and
            permissions herein; and (C) the Upload Data -- and our use of the
            Upload Data in accordance with these Terms and our{" "}
            <a href="/privacy">Privacy Notice</a> -- does not and will not
            violate Applicable Law or infringe or violate any third party
            rights.
          </React.Fragment>,
          <React.Fragment key={nanoid()}>
            1.4 TO THE EXTENT UPLOAD DATA IS OBTAINED FROM A HUMAN, YOU AGREE
            NOT TO PROVIDE UPLOAD DATA IN A FORM THAT CAN IDENTIFY (DIRECTLY OR
            INDIRECTLY TAKING INTO ACCOUNT ALL THE MEANS REASONABLY LIKELY TO BE
            USED) THE PERSON TO WHOM THE DATA RELATES OR THAT CONSTITUTES OR
            WOULD CONSTITUTE “PROTECTED HEALTH INFORMATION” OR REGULATED HEALTH
            INFORMATION UNDER APPLICABLE LAWS, SUCH AS THE U.S. HEALTH INSURANCE
            PORTABILITY AND ACCOUNTABILITY ACT (“HIPAA”). For example, the
            Upload Data shall not include any personal identifiers, including
            without limitation name, address, dates, telephone numbers, e-mail
            addresses, or medical health records.
          </React.Fragment>,
          <React.Fragment key={nanoid()}>
            1.5 To the extent that any Upload Data is obtained from a human data
            subject, you also specifically represent and warrant to us and our
            service partners that (A) you have provided any required notice to,
            and obtained any necessary informed consent of, any such person for
            the collection, use, and provision to CZ ID of the Upload Data; and
            (B) your provision of the Upload Data to CZ ID is covered under all
            such notices and consents, as well as Applicable Standards and
            Applicable Law. Please note that we filter out and discard human
            sequence data as part of generating Report Data because we don’t
            need this data for CZ ID. See <a href="/faqs">here</a> for more
            details.
          </React.Fragment>,
        ]}
      />
    </>
  );

  const renderAuthorizationToUseCZID = () => (
    <>
      <h2>
        <span className={cs.number}>2.</span>Authorization To Use CZ ID.
      </h2>
      <List
        listItems={[
          `2.1 Subject to and conditioned on your compliance with these Terms, we grant you permission to access and use CZ ID in accordance with Applicable Law, solely for your own internal academic or internal scientific research purposes. You may not permit any third party to access or use or “share” your Account. All persons wishing to access the Service must create their own separate account and agree to these Terms.`,
          `2.2 CZ ID may not be used to provide medical or other services to any third party (for instance, to inform or provide disease diagnoses). CZ ID is not intended to diagnose, treat, cure, or prevent any disease and is not a substitute for medical advice.`,
          `2.3 You shall not disclose or distribute the Database, in whole or in part, or any works derived from the Database to any third party for any purpose, except for the following:`,
          `You may disclose the documents that you download from the Database using CZ ID’s intended functionality to your employees and agents who are registered Users of the Service and who are engaged in conducting your research (“Research Associates”) for the sole purpose of carrying out your internal research. Your Research Associates must also agree to use CZ ID and Database in accordance with these Terms.`,
          `You may share research findings derived from use of CZ ID to others, including with the public, so long as these findings include no personally-identifying information and you comply with Applicable Law and these Terms.`,
          `You may disclose the Database to the minimum extent necessary to comply with Applicable Law or court order, so long as you promptly notify us prior to making such disclosure (to the extent Applicable Law and court order permit you to so notify us).`,
        ]}
      />
    </>
  );

  const renderLimitationsOnUse = () => (
    <>
      <h2>
        <span className={cs.number}>3.</span>Limitations On Use.
      </h2>
      <List
        listItems={[
          `3.1 You shall not re-identify or attempt to re-identify any Database records or content for any purpose other than responding to a request from the individual whom the record within your Upload Data is about, including without limitation to make employment decisions or to make eligibility, coverage, underwriting, premium-setting or other decisions with respect to insurance.`,
          `3.2 You shall not otherwise access or use, or attempt to access or use, CZ ID to take any action that could harm us, CZ ID or its Users, or any third party, or use CZ ID in any manner that violates Applicable Law or infringes or otherwise violates third party rights.`,
          `3.3 You represent and warrant that you are a natural person of legal age who is competent and able to enter into and carry out these Terms, and, if you are using CZ ID on behalf of any entity, that you are authorized to enter into these Terms on such entity’s behalf and that such entity agrees to be responsible to us if you or that entity violates these Terms.`,
          `3.4 We may restrict or terminate your access to CZ ID at any time, including for breach of these Terms. In such case we will attempt to provide you notice through the contact information we have for you.`,
        ]}
      />
    </>
  );

  const renderRegistrationAndContactInfo = () => (
    <>
      <h2>
        <span className={cs.number}>4.</span>Registration And Contact
        Information.
      </h2>
      <List
        listItems={[
          `4.1 To access CZ ID you will need to be a registered “User.” At registration, you will be asked to provide certain information (“Account Information”) to create an individual user account (an “Account”). You agree that you will not create more than one Account, or create an Account for anyone other than yourself. You may not share your Account credentials.`,
          <>
            4.2 You agree to keep your Account Information accurate and
            up-to-date. You agree that we may send to the e-mail address you
            provide us or otherwise electronically deliver notices or
            communications regarding CZ ID, including notices of updates to
            these terms and the <a href="/privacy">Privacy Notice</a>.
          </>,
        ]}
      />
    </>
  );

  const renderChangesToCZIDOrTerms = () => (
    <>
      <h2>
        <span className={cs.number}>5.</span>Changes To CZ ID Or These Terms.
      </h2>
      <List
        listItems={[
          `5.1 Changes to CZ ID. We may, from time to time, withdraw, suspend, change or update CZ ID (including the Database) or its features without notice, subject to Applicable Law. Neither we, nor our service providers, will be liable if all or any part of CZ ID is unavailable or changes at any time.`,
          `5.2 Changes to these Terms. We may update these Terms from time to time and will notify you of material changes to the Terms, prior to their becoming effective. If you do not agree to the updated Terms, your remedy will be to close your Account prior to the effective date of those changes.`,
          <>
            5.3 Closing Your Account. You can close your Account at any time.
            Just contact us at{" "}
            <a href="mailto:privacy@czid.org">privacy@czid.org</a>.
          </>,
        ]}
      />
    </>
  );

  const renderIntellectualPropertyAndSecurityTerms = () => (
    <>
      <h2>
        <span className={cs.number}>6.</span>Intellectual Property And Security.
      </h2>
      <List
        listItems={[
          `6.1 Intellectual Property Rights. Just because you upload data to CZ ID, you are not giving us any ownership of your intellectual property rights (see Section 1.1 above). Subject to these Terms, we grant you a limited right to access CZ ID, and we reserve all other of our intellectual property rights in CZ ID. Using CZ ID does not give you any ownership in CZ ID, our services or the content or information made available through CZ ID that is not already yours. Trademarks and logos used in connection with CZ ID are the trademarks of their respective owners. Our logos and other trademarks, service marks, graphics, and logos used for our services are trademarks or registered trademarks of ours and these Terms do not grant you any rights to use them.`,
          <>
            6.2 Feedback. We’d love your feedback about how to improve CZ ID at{" "}
            {<a href="mailto:help@czid.org">help@czid.org</a>}. That said, by
            giving us feedback, you agree that we can use and share it for any
            purpose without compensation to you. You agree that we are not
            required to use your feedback.
          </>,
          <>
            6.3 Security. You will establish, implement, and maintain
            appropriate physical, technical and organizational measures that are
            designed to: (a) protect the security and integrity of any network
            or system used to access CZ ID, including any Database records; and
            (b) guard against the accidental or unauthorized access, use,
            alteration or disclosure of CZ ID through your Account. Please
            notify us immediately at{" "}
            {<a href="mailto:security@czid.org">security@czid.org</a>} if you
            suspect your Account has been compromised or are aware of any other
            security issues relating to CZ ID.
          </>,
        ]}
      />
    </>
  );

  const renderDisclaimerTerms = () => (
    <>
      <h2>
        <span className={cs.number}>7.</span>Disclaimers.
      </h2>
      <List
        listItems={[
          <>
            7.1 In order to further infectious disease research, we rely upon
            Users to upload data to the Database. We and our service providers
            do not review or correct any data uploaded into CZ ID. If you would
            like to report any issue with CZ ID or the Database please contact
            us at {<a href="mailto:help@czid.org">help@czid.org</a>}. CZ ID is
            not intended as a storage service, so please back up your Upload
            Data using a secure service of your choice.
          </>,
          `7.2 TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:`,
          `7.2.1 YOUR ACCESS AND USE CZ ID AT YOUR SOLE RISK AND AGREE THAT WE AND OUR SERVICE PROVIDERS WILL NOT BE RESPONSIBLE FOR ANY ACTIONS YOU TAKE BASED ON CZ ID OR FOR ANY INACCURATE DATA OR OUTPUTS OF CZ ID (INCLUDING MISIDENTIFICATION OF -- OR THE FAILURE TO IDENTIFY -- DISEASE SEQUENCES).`,
          `7.2.2 CZ ID IS PROVIDED “AS IS” WITH ALL FAULTS, AND WE AND OUR SERVICE PROVIDERS HEREBY DISCLAIM ALL REPRESENTATIONS AND WARRANTIES, EXPRESS, STATUTORY, OR IMPLIED (INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OF TITLE, NON-INFRINGEMENT, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND ALL WARRANTIES ARISING FROM THE COURSE OF DEALING, USAGE, OR TRADE PRACTICE) WITH RESPECT TO CZ ID. CZ ID IS NOT INTENDED TO BE USED AND SHOULD NOT BE USED AS A MEDICAL DEVICE OR FOR PURPOSES OF MEDICAL DIAGNOSIS OR TREATMENT.`,
          `7.2.3 FOR CLARITY AND WITHOUT LIMITING THE FOREGOING, WE AND OUR SERVICE PROVIDERS DO NOT MAKE ANY GUARANTEES (I) REGARDING THE ACCURACY, COMPLETENESS, TIMELINESS, SECURITY, AVAILABILITY OR INTEGRITY OF CZ ID, (II) THAT CZ ID WILL BE UNINTERRUPTED OR OPERATE IN COMBINATION WITH ANY SOFTWARE, SERVICE, SYSTEM OR OTHER DATA, OR (III) THAT CZ ID WILL MEET ANY REQUIREMENTS OF ANY PERSON OR ENTITY, OR ANY REGULATORY APPROVALS OR REQUIREMENTS. WITHOUT LIMITATION, YOU ACKNOWLEDGE THAT CZ ID IS NOT A BUSINESS ASSOCIATE FOR PURPOSES OF HIPAA.`,
        ]}
      />
    </>
  );

  const renderLawTerms = () => (
    <>
      <h2>
        <span className={cs.number}>8.</span>Indemnification, Limitation Of
        Liability, And Choice Of Law.
      </h2>
      <List
        listItems={[
          `8.1 To the maximum extent permitted by Applicable Law, you agree to indemnify and hold harmless CZ Biohub, its affiliates (including without limitation the Chan Zuckerberg Initiative Foundation (CZIF), the Chan Zuckerberg Initiative, LLC (CZI LLC), and their successors, assigns, officers, directors, employees, and agents (collectively, the “CZ Biohub Protected Parties”) from and against any and all liabilities, costs, damages, charges, losses, penalties, judgments, settlements, and expenses (including reasonable attorney’s fees) (“Losses”) arising out of or related to any suit, demand, action, proceeding, or other claim by a third party (“Claims”) arising out of or relating to: (a) your actual or alleged failure to comply with Applicable Law or these Terms, (b) your Upload Data, or (c) your actual or alleged violation of any third party rights.`,
          `8.2 LIMITATION OF LIABILITY. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE CZ BIOHUB PROTECTED PARTIES WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES OF ANY KIND (INCLUDING LOST PROFITS, LOST DATA, BUSINESS INTERRUPTION, OR LOSS OF GOODWILL) IRRESPECTIVE OF WHETHER SUCH DAMAGES ARISE FROM CLAIMS BROUGHT IN CONTRACT, TORT, NEGLIGENCE, WARRANTY, STRICT LIABILITY, OR ANY OTHER THEORY AT LAW OR IN EQUITY, AND EVEN IF ANY CZ BIOHUB PROTECTED PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. WITHOUT LIMITING THE FOREGOING, TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL THE CZ BIOHUB PROTECTED PARTIES’ AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR CZ ID EXCEED USD $100. THE EXCLUSIONS AND LIMITATIONS SET FORTH IN THIS SECTION 8 DO NOT APPLY TO LOSSES ARISING FROM A CZ BIOHUB PROTECTED PARTY’S GROSS NEGLIGENCE OR WILLFUL MISCONDUCT. IF ANY LIMITATION IN THIS SECTION 8 IS UNENFORCEABLE IN ANY INSTANCE, THEN SUCH LIMITATION WILL APPLY TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW.`,
          `SOME LAWS DO NOT ALLOW THE LIMITATION OR EXCLUSION OF LIABILITY, SO THESE LIMITS MAY NOT APPLY TO YOU.`,
          `Choice of Law / Jurisdiction / Venue. These Terms, and all matters arising out of or relating to these Terms, whether sounding in contract, tort, or statute, will be governed by, and construed in accordance with, the laws of the State of California and/or applicable federal law (including the Federal Arbitration Act), without regard to conflict of law provisions. Subject to and without waiver of the arbitration provisions below, and unless prohibited by the laws of your country, you agree that any judicial proceedings (other than small claims actions as discussed above) will be brought in and you hereby consent to the exclusive jurisdiction and venue in the state courts in the City and County of San Mateo, California, or federal court for the Northern District of California. For countries where this is not permissible, this won’t deprive you of any protection you have under the law of the country where you live, or access to the courts in that country.`,
        ]}
      />
    </>
  );

  const renderMiscellaneousTerms = () => (
    <>
      <h2>
        <span className={cs.number}>10.</span>Miscellaneous.
      </h2>
      <List
        listItems={[
          `9.1 Severability. In the event any part of these Terms is deemed unenforceable, the remaining portion will remain in effect and you and we expressly authorize a court of competent jurisdiction to make the modifications that are necessary to comply with existing law, in a manner most closely representing the original intent of you and us as expressed in these Terms.`,
          `9.2 Assignment. You may not assign or delegate your rights or obligations under these Terms, in whole or in part, without our prior written approval (not to be unreasonably withheld); any assignment or delegation in violation of this provision will be null and void. We may assign our rights or delegate our obligations under these Terms. In the event of an assignment by us, we will provide you notice through the Service or contact information you have provided to us and these Terms shall otherwise remain in full force and effect and shall bind the permitted assignee.`,
          `9.3 Amendment. No waiver of any of the provisions of the Terms will constitute a waiver of any other provision (whether or not similar). No waiver will be binding unless executed in writing by the party to be bound by the waiver.`,
          <>
            9.4 Entire Agreement. These Terms (along with the{" "}
            <a href="/privacy">Privacy Notice</a>) constitute the entire
            agreement between you and us regarding CZ ID. If you wish to modify
            these Terms, any amendment must be provided to us in writing and
            signed by our authorized representative.
          </>,
        ]}
      />
    </>
  );

  const renderContactInfo = () => (
    <>
      <h2>
        <span className={cs.number}>11.</span> Contact Information.
      </h2>
      <List
        listItems={[
          <React.Fragment key={nanoid()}>
            If you have any questions, comments, or concerns with Terms, you may
            contact us at <a href="mailto:help@czid.org">help@czid.org</a>
          </React.Fragment>,
          <p key={nanoid()}>
            Our mailing address is:
            <br />
            Chan Zuckerberg Initiative Foundation
            <br />
            c/o The Chan Zuckerberg Initiative
            <br />
            Attn: General Counsel
            <br />
            801 Jefferson Ave
            <br />
            Redwood City, CA 94063
            <br />
            With a courtesy copy via email to:{" "}
            <a href="mailto:legalczi1@chanzuckerberg.com">
              legalczi1@chanzuckerberg.com
            </a>
            <br />
          </p>,
        ]}
      />
      <div style={{ height: "50px" }} />
    </>
  );

  const renderArbitrationTerms = () => (
    <>
      <h2>
        <span className={cs.number}>9.</span> ARBITRATION AGREEMENT AND CLASS
        ACTION WAIVER.
      </h2>
      <p>
        THIS SECTION CONSTITUTES AN ARBITRATION AGREEMENT (“
        <b>Arbitration Agreement</b>“); IT REQUIRES YOU AND CZ BIOHUB AND ITS
        AFFILIATES, INCLUDING WITHOUT LIMITATION THE CHAN ZUCKERBERG INITIATIVE
        FOUNDATION AND CHAN ZUCKERBERG INITIATIVE, LLC (COLLECTIVELY, THE “
        <b>CZ Parties</b>“) TO AGREE TO RESOLVE ALL DISPUTES BETWEEN US THROUGH
        BINDING INDIVIDUAL ARBITRATION, SO PLEASE READ IT CAREFULLY.
      </p>
      <List
        ordered
        listItems={[
          <>
            <b>Applicability.</b> You and the CZ Parties agree that all
            Disputes, including Enforceability Disputes, will be resolved
            exclusively in binding arbitration on an individual basis, except
            that you and the CZ Parties are not required to arbitrate IP
            Disputes. Notwithstanding the foregoing, either you or the CZ
            Parties may bring an individual action in small claims court.
            <div className={cs.nestedList}>
              <List
                ordered
                listItems={[
                  <>
                    A “<b>Dispute</b>” means a dispute, claim or controversy
                    arising out of or relating to the CZ Parties’ products or
                    these Terms; or whether that dispute is (1) based on past,
                    present or future events; and (2) in contract, warranty,
                    state, regulation, or other legal or equitable basis.
                  </>,
                  <>
                    An “<b>Enforceability Dispute</b>” means a Dispute relating
                    to the interpretation, applicability, or enforceability of
                    this Arbitration Agreement, including the formation of the
                    contract, the arbitrability of any Dispute, and any claim
                    that all or any part of this agreement is void or voidable.
                  </>,
                  <>
                    An “<b>IP Dispute</b>” means a Dispute relating to the
                    ownership or enforcement of intellectual property rights.
                  </>,
                ]}
              />
            </div>
          </>,
          <>
            <b>Waivers.</b>
            <div className={cs.nestedList}>
              <List
                ordered
                listItems={[
                  <>
                    <b>Waiver of Jury Right.</b> YOU AND THE CZ Parties ARE
                    EXPRESSLY GIVING UP ALL RIGHTS TO A JURY TRIAL OR COURT
                    TRIAL BEFORE A JUDGE. The arbitrator’s decision will be
                    final and binding on both you and us, subject to review
                    solely on the grounds set forth in the Federal Arbitration
                    Act (“<b>FAA</b>”).
                  </>,
                  <>
                    <b>Waiver of Class or Consolidated Actions.</b> YOU AND THE
                    CZ PARTIES AGREE THAT ALL DISPUTES MUST BE ARBITRATED OR
                    LITIGATED ON AN INDIVIDUAL BASIS AND NOT ON A CLASS,
                    COLLECTIVE ACTION, OR REPRESENTATIVE BASIS. The validity of
                    this waiver – and whether an action may proceed as a class,
                    collective or representative action – must be decided by a
                    court.
                  </>,
                ]}
              />
            </div>
          </>,
          <>
            <b>Initiating a Dispute.</b>
            <div className={cs.nestedList}>
              <List
                ordered
                listItems={[
                  `To initiate a Dispute, a party must send to the other party written notice of that Dispute containing: (a) the name, address, and contact information of the party giving notice; (b) the facts giving rise to the Dispute; and (c) the relief requested.`,
                  `You and we agree that we shall (in good faith) meet and attempt to resolve the Dispute within 30 days. If the Dispute is not resolved during that time period, then you and a representative of the applicable CZ ID Party shall (in good faith) meet and attempt to resolve the Dispute through non-binding mediation with a mutually agreed-upon mediator within 30 additional days. If you and we do not reach an agreement to resolve the dispute within that 60-day period, you or we may commence an arbitration proceeding or file a claim in small claims court.`,
                ]}
              />
            </div>
          </>,
          <>
            <b>Arbitration Rules and Procedure.</b>
            <div className={cs.nestedList}>
              <List
                ordered
                listItems={[
                  <>
                    <b>Rules.</b> The FAA governs the interpretation and
                    enforcement of this Arbitration Agreement. Judicial
                    Arbitration & Mediation Services, Inc. (“<b>JAMS</b>”) will
                    administer the arbitration before a single arbitrator, and
                    the arbitration will be initiated and conducted according to
                    the Streamlined Arbitration Rules and Procedures (the “
                    <b>JAMS Rules</b>”), to the extent they are not inconsistent
                    with the terms of this agreement. The JAMS Rules and
                    instructions about how to initiate an arbitration are
                    available at{" "}
                    <a href="https://www.jamsadr.com/rules-streamlined-arbitration">
                      https://www.jamsadr.com/rules-streamlined-arbitration
                    </a>{" "}
                    (as of the date of this agreement) or 1-800-352-5267.
                  </>,
                  <>
                    <b>Fees.</b> Pursuant to the JAMS Consumer Arbitration
                    Minimum Standards, the CZ Parties will bear all costs of the
                    arbitration (including any JAMS Case Management Fee and all
                    professional fees for the arbitrator’s services), except for
                    the filing fee if you are the party initiating the
                    arbitration.
                  </>,
                  <>
                    <b>Manner and Location of Arbitration.</b> You may choose to
                    have the arbitration conducted by telephone, in writing,
                    online, or in person. If in person, you may choose to have
                    the arbitration conducted (a) in San Mateo County,
                    California, (b) in the county where you live, or (c) at
                    another location that you and we agree upon.
                  </>,
                ]}
              />
            </div>
          </>,
          <>
            <b>Confidentiality.</b> All aspects of the arbitration, including
            without limitation the record of the proceeding, are confidential
            and will not be open to the public, except (a) to the extent both
            parties agree otherwise in writing, (b) as may be appropriate in any
            subsequent proceedings between the parties, or (c) as may otherwise
            be appropriate in response to a governmental agency or legal
            process, provided that the party upon whom such process is served
            shall give immediate notice of such process to the other party and
            afford the other party an appropriate opportunity to object to such
            process.
          </>,
          <>
            <b>Opt-Out.</b> You may opt out of this Arbitration Agreement by
            notifying us by mail no later than 30 days after first becoming
            subject to it. Your notice must include your name, address, and a
            clear statement that you want to opt out of this Arbitration
            Agreement.
          </>,
          <>
            <b>Severability.</b> If any portion of this Arbitration Agreement is
            found to be unlawful, void or for any reason unenforceable, then
            that portion shall be severed and the remainder of this Arbitration
            Agreement shall be given full force and effect.
          </>,
        ]}
      />
    </>
  );

  return (
    <NarrowContainer className={cs.termsOfUse} size="small">
      {renderIntro()}
      {renderSummaryOfKeyThingsToKnow()}
      {renderAboutCZID()}
      {renderUploadAndReportDataTerms()}
      {renderAuthorizationToUseCZID()}
      {renderLimitationsOnUse()}
      {renderRegistrationAndContactInfo()}
      {renderChangesToCZIDOrTerms()}
      {renderIntellectualPropertyAndSecurityTerms()}
      {renderDisclaimerTerms()}
      {renderLawTerms()}
      {renderArbitrationTerms()}
      {renderMiscellaneousTerms()}
      {renderContactInfo()}
    </NarrowContainer>
  );
}
