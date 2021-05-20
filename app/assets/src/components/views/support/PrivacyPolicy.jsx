import { nanoid } from "nanoid";
import React from "react";

import { NarrowContainer } from "~/components/layout";
import List from "~/components/ui/List";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { NEXTCLADE_APP_LINK } from "~/components/utils/documentationLinks";

import cs from "./support.scss";

const PrivacyPolicy = () => {
  const renderIntro = () => (
    <>
      <div className={cs.title}>
        <h1>IDseq Data Privacy</h1>
        <h4 className={cs.subtitle}>
          Last Updated: April 1, 2021.{" "}
          <a href="/terms_changes">See Recent Changes</a>
        </h4>
      </div>
      <p>
        The Chan Zuckerberg Biohub Inc. (“CZ Biohub,” “we,” “ us,” or “our”)
        provides the IDseq platform (“Services” or “IDseq”) in partnership with
        the Chan Zuckerberg Initiative, LLC (“CZI”). This Data Privacy Notice (“
        Privacy Notice”) describes the types of information we collect or that
        is uploaded by website visitors (“Visitors”) and registered users
        (“Users”), and how we use, share, and protect that information.
      </p>
      <p>
        For ease of understanding, we’ve created the below Summary Table, which
        pulls out some key points. More details can be found in our{" "}
        <a href="/faqs">FAQ</a>, as well as the full Privacy Policy below and
        the <a href="/terms">Terms of Use</a> (“Terms”) that applies to your use
        of IDseq.
      </p>
    </>
  );

  const renderSummaryTable = () => (
    <>
      <table className={cs.privacySummaryTable}>
        <tbody>
          <tr className={cs.topRow}>
            <td>Type of Data</td>
            <td>What is it?</td>
            <td>What’s it used for?</td>
            <td>How is it shared?</td>
            <td>Your Choices</td>
          </tr>
          <tr className={cs.sectionRow}>
            <td colSpan="5">
              <b>Data you upload to or create using IDseq</b>
            </td>
          </tr>
          <tr className={cs.contentRow}>
            <td>
              <b>Raw Sample Data</b>
            </td>
            <td>Genetic sequence files (ex: FASTA/FASTQ) uploaded by Users.</td>
            <td>
              Upon upload, Raw Sample Data is processed through our data
              pipeline and all host (ex: human, mosquito) genetic information is
              filtered out. We always filter out all human genetic information,
              regardless of host. We use the remaining data, with Sample
              Metadata, to create Reports and Visualizations showing the
              microorganisms in your sample. These can be shared with other
              IDseq users.
            </td>
            <td>
              Raw Sample Data is not shared with any other IDseq user, nor is it
              ever accessed by anyone working on IDseq unless specifically
              requested by a User, such as to debug an issue.
            </td>
            <td rowSpan="4">
              Users can request deletion of Raw Sample Data or their IDseq
              account data by contacting us at privacy@idseq.net and we will
              fulfill the request within 60 days.
            </td>
          </tr>
          <tr className={cs.contentRow}>
            <td>
              <b>Sample Metadata</b>
            </td>
            <td>
              Data about Samples annotated by Users (ex: sequencer used, sample
              collection date).
            </td>
            <td>See above.</td>
            <td>
              <div>
                <p>
                  Report Data and Visualizations that Users create can include
                  Sample Metadata. IDseq Users may choose to share that Report
                  Data and/or Visualizations (including Sample Metadata) with
                  other IDseq Users.
                </p>
                <br />
                <p>
                  This data is also shared with technical partners (Chan
                  Zuckerberg Initiative, LLC - CZI LLC) and Service Providers
                  (ex: AWS) that help operate and secure IDseq. CZI LLC and
                  Service Providers are limited by this Privacy Policy and will
                  not use any data shared with them for any purpose beyond
                  operating and securing IDseq.
                </p>
                <br />
                <p>
                  We will never sell your data or share it with anyone that
                  does.
                </p>
              </div>
            </td>
          </tr>
          <tr className={cs.contentRow}>
            <td>
              <b>Report Data</b>
            </td>
            <td>
              Data about non-host microorganisms that may be contained in the
              uploaded sample (includes Sample Metadata).
            </td>
            <td>See above.</td>
            <td>See above.</td>
          </tr>
          <tr className={cs.contentRow}>
            <td>
              <b>Visualizations</b>
            </td>
            <td>
              Analyses created by Users based on Report Data (ex: heatmaps and
              phylogenetic trees). Can include Sample Metadata.
            </td>
            <td>See above.</td>
            <td>See above.</td>
          </tr>
          <tr className={cs.sectionRow}>
            <td colSpan="5">
              <b>Data IDseq collects</b>
            </td>
          </tr>
          <tr className={cs.contentRow}>
            <td>
              <b>User Data</b>
            </td>
            <td>
              Data about researchers with IDseq accounts such as name, email,
              institution, basic information about how they are using IDseq (ex:
              search queries), and information provided for user support (ex:
              resolving support requests).
            </td>
            <td>
              We use this data only to operate, secure, and improve the IDseq
              services.
            </td>
            <td>
              <div>
                <p>
                  Basic IDseq account information such as name and institution
                  may be visible to other IDseq Users (ex: with collaborators on
                  a shared project).
                </p>
                <br />
                <p>
                  This data is also shared with technical partners (CZI LLC) and
                  Service Providers (ex: AWS) that help operate and secure
                  IDseq.
                </p>
                <br />
                <p>
                  CZI LLC and Service Providers are limited by this Privacy
                  Policy and will not use any data shared with them for any
                  purpose beyond operating and securing IDseq.
                </p>
                <br />
                <p>
                  We will never sell your data or share it with anyone that
                  does.
                </p>
              </div>
            </td>
            <td rowSpan="2">
              Users can request deletion of their IDseq account data by
              contacting us at privacy@idseq.net and we will fulfill the request
              within 60 days.
            </td>
          </tr>
          <tr className={cs.contentRow}>
            <td>
              <b>Device and Analytics Data</b>
            </td>
            <td>
              Device Data (ex: browser type and operating system) and Analytics
              Information (ex: links within IDseq you click on and how often you
              log into IDseq) includes basic information about how Users and
              Visitors are interacting with IDseq.
            </td>
            <td>See above.</td>
            <td>See above.</td>
          </tr>
          <tr className={cs.contentRow}>
            <td>
              <b>Visitor Data</b>
            </td>
            <td>
              Data about visitors (non-Users) to IDseq pages, such as IDseq.net
              and includes basic analytics information (ex: links clicked).
            </td>
            <td>See above.</td>
            <td>See above.</td>
            <td>This data is not personally identifiable.</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  const renderAboutIdseq = () => (
    <>
      <h3>About IDseq</h3>
      <p>
        IDseq is an online platform designed to enable the research community to
        research pathogens in metagenomic sequencing and to help further the
        study of infectious diseases. To do this, IDseq processes genetic data
        in order to identify pathogens contained within.
      </p>
      <p>
        Here’s how IDseq works: Users submit Upload Data (as described below).
        This data may contain human and non-human genetic sequences (“Raw Sample
        Data”; as further defined below), as well as information about those
        sequences, such as the date the sample was collected and the host
        species it was collected from (“Sample Metadata” as further defined
        below). For example, a researcher might upload genetic information from
        mosquitoes, which are often a source of infectious disease, or from
        humans, who can be infected by such diseases. IDseq then processes this
        Upload Data in order to identify pathogens found within the genetic
        sequence (e.g., the mosquito may be carrying the chikungunya virus).
      </p>
      <p>
        We hope that this sharing of pathogen data will help to create a global
        dashboard that helps researchers better understand pathogens.
      </p>
      <p>
        IDseq also collects information about Users in order to offer the
        Service. Other than basic information required to create an account
        (e.g. email address, name), the User determines what information they
        want to upload onto IDseq. Please note: IDseq is not designed for or
        directed toward children under the age of sixteen.
      </p>
    </>
  );

  const renderUploadDataPolicy = () => (
    <>
      <h2>
        <span className={cs.number}>1.</span>Upload Data.
      </h2>
      <p>
        “Upload Data” is data that Users upload to IDseq (other than the
        information Users provide during registration to create an account). As
        explained below, Upload Data consists of genetic sequence information
        (human or non-human) and metadata about those genetic sequences (such as
        time and location of sample collection).
      </p>
      <p>
        As described in our Terms, Users are required to obtain and maintain all
        necessary consents, permissions, and authorizations required by
        applicable laws prior to uploading, sharing, and exporting Upload Data
        with the Services.
      </p>
      <p>
        <div className={cs.underlineHeader}>What Is Upload Data?</div>
      </p>
      <p>Upload Data includes Sample Data and Sample Metadata.</p>
      <List
        listItems={[
          <React.Fragment key={nanoid()}>
            <span className={cs.listItemLabel}>Raw Sample Data:</span>
            “Raw Sample Data” is full genetic sequence data uploaded by Users
            (i.e. FASTA or FASTQ files). Genetic sequence data contains genetic
            information about pathogens in the sample and of the host from which
            the sample was taken. The host could be a human or non-human (e.g.,
            mosquito). Host genetic information is filtered out in order to
            generate Reports, so Report Data should not contain any human
            sequence data.
          </React.Fragment>,
          <React.Fragment key={nanoid()}>
            <span className={cs.listItemLabel}>Sample Metadata:</span>
            “Sample Metadata” includes information related to the Raw Sample
            Data, such as the host type (e.g., human or mosquito), upload date,
            and tissue type and free-text research notes entered by Users. This
            data should not include personally-identifying information regarding
            the individual to whom the Raw Sample Data relates.
          </React.Fragment>,
        ]}
      />
      <p>
        <div className={cs.underlineHeader}>How We Use Upload Data</div>
      </p>
      <p>Upload Data is used for the following purposes:</p>
      <List
        listItems={[
          `To create Report Data (described below), including new reports for
        Users when we update our Data Pipeline.`,
          `To improve the way IDseq creates Report Data, including improving
        our Data Pipeline.`,
          `To debug in the event you reach out to us with a specific issue related to your Upload Data. `,
        ]}
      />
      <p>We will never sell your data or share it with anyone that does.</p>
      <p>
        <div className={cs.underlineHeader}>How We Share Upload Data</div>
      </p>
      <p>
        Raw Sample Data is <b>never</b> shared with anyone other than the User
        that uploaded the Sample. Even staff working on IDseq cannot access this
        information except as specifically instructed by a User, such as to
        debug an issue.
      </p>
      <p>
        In order to advance IDseq’s goal of creating a global pathogen dashboard
        for researchers, Report Data and Sample Metadata will be made available
        to <b>all IDseq users</b> 1 year after Raw Sample Data is uploaded.
        Before this 1-year anniversary of upload, Users can also choose to share
        their Report Data and Sample Metadata by creating Projects (groups of
        Reports) and sharing those Projects with other IDseq users.
      </p>
      <p>
        If you have questions about how this 1-year anniversary policy impacts
        your data, then please reach out to{" "}
        <a href="mailto:help@idseq.net">help@idseq.net</a>.
      </p>
      <p>
        <div className={cs.underlineHeader}>
          What’s our legal basis to use and share Upload Data?
        </div>
      </p>
      <p>
        To the extent that the European Union’s General Data Protection
        Regulation (“GDPR”) applies, we rely on the following legal bases to use
        and share personal data within Upload Data:
      </p>
      <List
        listItems={[
          `The explicit consent of the individual whose data is contained in Raw Sample Data, where such consent has been obtained by the User in accordance with the GDPR; and`,
          `The public interest and our and our Users’ legitimate interest in investigating and stopping the spread of infectious diseases and promoting global health. The use and sharing of personal data within Upload Data furthers the public interest in the area of public health, particularly by helping to protect against serious cross-border threats to health. The processing of personal data within Upload Data is also necessary for scientific research purposes.`,
        ]}
      />
    </>
  );

  const renderReportDataPolicy = () => (
    <>
      <h2>
        <span className={cs.number}>2.</span>Report Data.
      </h2>
      <p>
        Report Data is information IDseq produced from Upload Data. We generate
        Report Data by processing Upload Data through our Data Pipeline. The
        “Data Pipeline” cleans (e.g., by removing duplicate nucleotides) and
        analyzes (e.g., by matching Raw Sample Data nucleotide sequences with
        known pathogen sequences) the Upload Data. Report Data may include, for
        example, data about the pathogen sequences identified in the Raw Sample
        Data and the frequency of such identification (“Pathogen Data”) or raw
        numeric counts of non-personally identifying gene expression profiles
        that were found in the Raw Sample Data (“Gene Counts”).
      </p>
      <p>
        Once Raw Sample Data has been put through the Data Pipeline, the Report
        Data that is produced no longer includes any human genetic sequence
        data, and is not personal data, and does not, on its own, permit
        association with any specific individual. If you are able to find human
        sequence data in any Reports in IDseq, please let us know at
        privacy@idseq.net and we will address it.
      </p>
      <p>
        <div className={cs.underlineHeader}>Who can see Report Data?</div>
      </p>
      <p>
        As mentioned above, after 1 year from when Raw Sample Data is uploaded,
        Report Data (including Sample Metadata) is visible to all IDseq Users,
        and they may share it with others beyond IDseq. This <b>does not</b>{" "}
        include Raw Sample Data - those genetic sequence files are available
        only to the User that uploaded the Sample.
      </p>
      <p>
        Users also have the option to share their Report Data with certain third
        party tools, like{" "}
        <ExternalLink href={NEXTCLADE_APP_LINK}>Nextclade</ExternalLink>. You
        control whether to use this integration or not. If you do, we will
        collect basic information about your use of that integration, such as
        how often you use it.
      </p>
    </>
  );

  const renderVisitorAndUserDataPolicy = () => (
    <>
      <h2>
        <span className={cs.number}>3.</span>Visitor and User Data.
      </h2>
      <p>
        Visitor and User Data is the information we collect from you and your
        use of IDseq.
      </p>
      <p>
        <div className={cs.underlineHeader}>What We Collect</div>
      </p>
      <List
        listItems={[
          <React.Fragment key={nanoid()}>
            <span className={cs.listItemLabel}>Visitor Data.</span>
            This is information collected from visitors to our website, whether
            or not they are Users (“Visitor Data”).
          </React.Fragment>,
          <React.Fragment key={nanoid()}>
            <span className={cs.listItemLabel}>User Data.</span>
            User Data is any information we collect from a User about that User
            (“User Data”). It may include information necessary to create or
            access your account such as your name, username, email address, and
            login credentials.
          </React.Fragment>,
          <React.Fragment key={nanoid()}>
            <span className={cs.listItemLabel}>Device and Analytics Data.</span>
            When Visitors and Users visit or use our Service, we may
            automatically collect Device Data or Analytics Information. “Device
            Data” includes information about your browser type and operating
            system, IP address and/or device ID, including basic analytics from
            your device or browser. “Analytics Information” relates to any of
            your requests, queries, or use of the Services, such as the amount
            of time spent viewing particular web pages. We use{" "}
            <a href="/faqs">Google Analytics</a> for this service.
          </React.Fragment>,
          <React.Fragment key={nanoid()}>
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
            about our use of cookies, please see our <a href="/faqs">FAQ</a>.
          </React.Fragment>,
        ]}
      />
      <p>
        <div className={cs.underlineHeader}>How We Use That Data</div>
      </p>
      <p>
        Visitor Data and User Data (including any Personal Data in the Visitor
        Data and User Data) will be used for the following purposes:
      </p>
      <List
        listItems={[
          `To identify you, create a profile for Users, and verify User’s
          identity so you can log in to and use IDseq.`,
          `To provide you with notices about your account and updates about
        IDseq.`,
          `To respond to your inquiries and requests.`,
          `To analyze how Users and Visitors are using IDseq so we can optimize
        and improve it.`,
          `To protect the security and integrity of IDseq.`,
        ]}
      />
      <p>
        <div className={cs.underlineHeader}>
          What is our legal basis for using Personal Data in Visitor Data and
          User Data?
        </div>
      </p>
      <p>
        We (along with CZI LLC) have a legitimate interest in using personal
        data within Visitor Data and User Data in the ways described in this
        Privacy Policy operate, secure, and improve IDseq. This allows us to
        improve the service that we provide to Users which, in turn, supports
        research regarding the study of infectious disease with the potential to
        benefit global public health.
      </p>
    </>
  );

  const renderVendorAndThirdPartyPolicy = () => (
    <>
      <h2>
        <span className={cs.number}>4.</span>Vendors and Other Third Parties.
      </h2>
      <p>
        CZ Biohub and CZIF collaborate closely in order to build, design, and
        operate IDseq so that it can be as useful as possible to researchers and
        the public health community. CZI LLC is our primary technology partner,
        focusing on IDseq’s infrastructure, security, and compliance. The three
        parties are all data controllers for data within IDseq and will use data
        only as described in this Privacy Policy.
      </p>
      <p>
        We also share Upload Data, Report Data, Visitor Data, and User Data with
        service providers, including service providers to CZI LLC, such as
        database providers like Amazon Web Services and customer support
        providers like Zendesk. We may also share Visitor and User data with
        analytics vendors that assist us to improve and optimize IDseq. To learn
        more about our vendors we use, please see our <a href="/faqs">FAQ</a> or
        contact us at privacy@idseq.net.
      </p>
      <p>
        If we can no longer keep operating IDseq or believe that its purpose is
        better served by having another entity operating it, we will transfer
        IDseq and all data existing therein (Upload Data, Report Data, Visitor
        Data, and User Data) so that the Users can continue to be served. We
        will always let you know before this happens, and you will have the
        option to delete your account and any data you’ve uploaded. Should this
        occur, the entity to which we transfer your data will be obliged to use
        it in a manner that is consistent with this Privacy Notice and the
        Terms.
      </p>
      <p>
        We may disclose Upload Data, Report Data, Visitor Data, and/or User Data
        if we believe in good faith that such disclosure is necessary (a) in
        connection with any legal investigation; (b) to comply with relevant
        laws or to respond to subpoenas or warrants served on us; (c) to protect
        or defend our rights or property or those of Users; and/or (d) to
        investigate or assist in preventing any violation or potential violation
        of the law, this Privacy Notice, or our Terms.
      </p>
    </>
  );

  const renderInformationProtectionPolicy = () => (
    <>
      <h2>
        <span className={cs.number}>5.</span>How We Protect the Information.
      </h2>
      <p>
        We use industry standard security measures to ensure the
        confidentiality, integrity and availability of data uploaded into IDseq.
        This includes practices like encrypting connections to IDseq using TLS,
        hosting IDseq on leading cloud providers with robust physical security,
        and ensuring that access to any personal data within IDseq by staff
        working on the tool is strictly limited. And as mentioned above, Raw
        Sample Data is <b>never shared</b> with anyone other than the User that
        uploaded the Sample. Even staff working on IDseq cannot access this
        information except as specifically instructed by a User, such as to
        debug an issue.
      </p>
      <p>
        Security takes ongoing work and we will continue to monitor and adjust
        our security measures as IDseq develops. Please notify us immediately at{" "}
        <a href="mailto:security@idseq.net">security@idseq.net</a> if you
        suspect your account has been compromised or are aware of any other
        security issues relating to IDseq.
      </p>
    </>
  );

  const renderDataRetentionAndDeletionPolicy = () => (
    <>
      <h2>
        <span className={cs.number}>6.</span>How Long We Retain Data and Data
        Deletion.
      </h2>
      <p>
        We retain your personal data only as long as is reasonably necessary:
      </p>
      <List
        listItems={[
          `Raw Sample Data and Sample Metadata is retained until Users delete it from IDseq. Users may submit deletion requests by emailing privacy@idseq.net and we will delete the requested Raw Sample Data and corresponding Report Data (including Sample Metadata) within 60 days.`,
          `Report Data produced by IDseq will be retained on IDseq.`,
          `User Data is retained until Users delete their IDseq account as such data is required to manage the service. Users may submit account deletion requests by emailing privacy@idseq.net. We will delete personal data within 60 days following close of your account.`,
        ]}
      />
      <p>
        Please note that we do not control, and so cannot delete, personal data
        that Users have copied outside of IDseq.
      </p>
    </>
  );

  const renderUserDataChoicesPolicy = () => (
    <>
      <h2>
        <span className={cs.number}>7.</span>Choices About Your Data.
      </h2>
      <p>If you are a User, you have the following choices:</p>
      <List
        listItems={[
          `Users are able to request the deletion of User Data that constitutes their personal data or Raw Sample Data that they submitted to IDseq.`,
          `Users are able to access and download Report Data relating to Upload Data they submitted within IDseq.`,
          `Users may also object to the processing of User Data in certain circumstances by emailing privacy@idseq.net. In such cases, we will stop processing that data unless we have legitimate grounds to continue processing it -- for example, it is needed for legal reasons.`,
          `Users can also contact us by emailing privacy@idseq.net should they wish to access, restrict the processing of, or rectify their User Data.`,
        ]}
      />
      <p>
        If a User has submitted Upload Data containing your personal data,
        please see below:
      </p>
      <List
        listItems={[
          `We require Users who submit Upload Data to ensure they have all necessary consents, permissions, and authorizations to do so. We are unable to relate Upload Data to identifiable individuals and so cannot directly process requests from persons whose personal sequencing data may be contained in Upload Data. As a result, IDseq is able to receive access, restriction, rectification, objection, or deletion requests only from Users.`,
          `If you believe your information has been uploaded to IDseq, you should contact the researcher or User that uploaded this information to (i) request access to the information, (ii) object to the processing of the information, or (iii) seek deletion, restriction, or rectification of the information. Similarly, if you previously provided consent to a researcher or User, you may have the right to withdraw that consent. You should contact the researcher or User to make such a withdrawal or otherwise exercise your rights.`,
        ]}
      />
      <p>
        Please contact us at{" "}
        <a href="mailto:privacy@idseq.net">privacy@idseq.net</a> if you would
        like to exercise the privacy choices discussed above or if you have any
        questions. If your data is subject to the EU data protection law (e.g.,
        GDPR) and you wish to raise a concern about our use of your information
        (and without prejudice to any other rights you may have), you have the
        right to do so with your local supervisory authority or by emailing us
        at <a href="mailto:privacy@idseq.net">privacy@idseq.net</a>.
      </p>
    </>
  );

  const renderDataTransferPolicy = () => (
    <>
      <h2>
        <span className={cs.number}>8.</span>Data Transfers.
      </h2>
      <p>
        IDseq is a global service. By using IDseq, Users authorize us to
        transfer and store the uploaded data outside of your home country,
        including to the United States, for the purposes described in this
        Privacy Notice.
      </p>
      <p>
        If you want to use IDseq, you must first agree to our{" "}
        <a href="/terms">Terms</a>, which set out the contract between IDseq and
        our Users. We operate in countries worldwide (including in the United
        States) and use technical infrastructure in the United States to deliver
        the Services to you. In accordance with the contract between us and our
        Users, we need to transfer personal data to the United States and to
        other jurisdictions as necessary to provide the Services. Such transfers
        are necessary for important reasons of public interest, namely global
        health and providing information which can be used by researchers to
        better understand the spread of infectious diseases. Please note that
        the privacy protections and the rights of authorities to access your
        information in these countries may not be the same as in your home
        country.
      </p>
    </>
  );

  const renderContactInfo = () => (
    <>
      <h2>
        <span className={cs.number}>9.</span>How to Contact Us.
      </h2>
      <p>
        If you have any questions, comments, or concerns with this Privacy
        Notice, you may contact our Data Protection Officer (DPO) by email at
        privacy@idseq.net or by physical mail at the addresses below.
      </p>
      <p>
        To comply with article 27 of the GDPR and the UK-GDPR, we have appointed
        a representative who can accept communications in relation to personal
        data processing activities falling within the scope of the GDPR or the
        UK-GDPR. If you wish to contact them, their details are as follows:
      </p>
      <p>
        <div className={cs.underlineHeader}>European GDPR Representative:</div>
        <p>
          Bird & Bird GDPR Representative Services SRL
          <br />
          Avenue Louise 235
          <br />
          1050 Bruxelles
          <br />
          Belgium
          <br />
          <a href="mailto:EUrepresentative.ChanZuckerberg@twobirds.com">
            EUrepresentative.ChanZuckerberg@twobirds.com
          </a>
        </p>
      </p>
      <p>
        <div className={cs.underlineHeader}>
          UK Data Protection Representative:
        </div>
        <p>
          Bird & Bird GDPR Representative Services UK
          <br />
          12 New Fetter Lane
          <br />
          London EC4A 1JP
          <br />
          United Kingdom
          <br />
          <a href="mailto:UKrepresentative.ChanZuckerberg@twobirds.com">
            UKrepresentative.ChanZuckerberg@twobirds.com
          </a>
        </p>
      </p>
    </>
  );

  const renderChangesToPrivacyNotice = () => (
    <>
      <h2>
        <span className={cs.number}>10.</span>Changes to This Privacy Notice.
      </h2>
      <p className={cs.last}>
        This Privacy Notice was last updated on the date above. We may update
        this Privacy Notice from time to time and will provide you with notice
        of material updates before they become effective.
      </p>
      <div style={{ height: "50px" }} />
    </>
  );

  return (
    <NarrowContainer className={cs.privacyPolicy} size="small">
      {renderIntro()}
      {renderSummaryTable()}
      {renderAboutIdseq()}
      {renderUploadDataPolicy()}
      {renderReportDataPolicy()}
      {renderVisitorAndUserDataPolicy()}
      {renderVendorAndThirdPartyPolicy()}
      {renderInformationProtectionPolicy()}
      {renderDataRetentionAndDeletionPolicy()}
      {renderUserDataChoicesPolicy()}
      {renderDataTransferPolicy()}
      {renderContactInfo()}
      {renderChangesToPrivacyNotice()}
    </NarrowContainer>
  );
};

export default PrivacyPolicy;
