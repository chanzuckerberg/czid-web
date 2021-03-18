import React from "react";
import { NarrowContainer } from "~/components/layout";
import Notification from "~ui/notifications/Notification";
import List from "~/components/ui/List";
import ExternalLink from "~ui/controls/ExternalLink";
import { PREVIEW_TERMS_AND_PRIVACY_POLICY_CHANGES_DOC_LINK } from "~/components/utils/documentationLinks";
import { nanoid } from "nanoid";
import cs from "./support.scss";

export default class PrivacyPolicy extends React.Component {
  render() {
    return (
      <NarrowContainer className={cs.privacyPolicy} size="small">
        <div className={cs.title}>
          <h1>IDseq Data Privacy Notice</h1>
          <h4 className={cs.subtitle}>
            Last Updated: May 13, 2019.{" "}
            <a href="/terms_changes">See Recent Changes</a>
          </h4>
          <Notification type="info" displayStyle="flat">
            We invite you to{" "}
            <ExternalLink
              href={PREVIEW_TERMS_AND_PRIVACY_POLICY_CHANGES_DOC_LINK}
            >
              preview
            </ExternalLink>{" "}
            our updated Privacy Policy, which will go into effect on April 1,
            2021. <a href="/terms_changes">Learn more about these changes.</a>
          </Notification>
        </div>
        <p className={cs.large}>
          The Chan Zuckerberg Biohub Inc. (“<b>CZ Biohub</b>,” “<b>we</b>,” “
          <b>us</b>,” or “<b>our</b>”) provides the IDseq platform (“
          <b>Services</b>” or “<b>IDseq</b>”) in partnership with the Chan
          Zuckerberg Initiative, LLC (“CZI”). This Data Privacy Notice (“
          <b>Privacy Notice</b>”) describes the types of information we collect
          or that is uploaded by website visitors (“<b>Visitors</b>”) and
          registered users (“<b>Users</b>”), and how we use, share, and protect
          that information. See our <a href="/faqs">FAQ</a>, which has useful
          information about IDseq, and for more information about our data
          practices, the IDseq service and the <a href="/terms">Terms of Use</a>{" "}
          (“<b>Terms</b>”) that applies to your access and use of IDseq.
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
          below). This data may contain human and non-human genetic sequences (“
          <b>Sample Data</b>”; as further defined below), as well as information
          about those sequences, such as the date the sample was collected and
          the species it was collected from (“<b>Sample Metadata</b>” as further
          defined below). For example, a researcher might upload genetic
          information from mosquitoes, which are often a source of infectious
          disease, or from humans, who can be infected by such diseases. IDseq
          then processes this Upload Data in order to identify pathogens found
          within the genetic sequence (e.g., the mosquito may be carrying the
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
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>Sample Data:</span>“
              <b>Sample Data</b>” is full genetic sequence data uploaded by
              Users. Genetic sequence data contains genetic information about
              pathogens in the sample and of the host from which the sample was
              taken. The host could be a human or non-human (e.g., mosquito).
              You should not be able to find any human sequence data in IDseq
              other than those embedded in samples you yourself have uploaded.
              This is because we filter out and discard host sequence data in
              order to generate Reports. If you are able to find human sequence
              data elsewhere in IDseq, please let us know at{" "}
              <a href="mailto:privacy@idseq.net">privacy@idseq.net</a> and we
              will address it.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>Sample Metadata:</span>“
              <b>Sample Metadata</b>” includes information related to the Sample
              Data, such as the host type (e.g., human or mosquito), upload
              date, and tissue type and free-text research notes entered by
              Users. This data <u>should not</u> include personally-identifying
              information regarding the individual to whom the Sample Data
              relates.
            </React.Fragment>,
          ]}
        />
        <p className={cs.large}>
          <div className={cs.underlineHeader}>How We Use Upload Data</div>
        </p>
        <p className={cs.large}>
          Upload Data is used for the following purposes:
        </p>
        <List
          listItems={[
            `To create Report Data (described below), including new reports for
          Users when we update our Data Pipeline.`,
            `To improve the way IDseq creates Report Data, including improving
          our Data Pipeline.`,
          ]}
        />
        <p className={cs.large}>
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
        <List
          listItems={[
            `The explicit consent of the individual whose data is being analyzed,
          where such consent has been obtained by the User in accordance with
          the GDPR; and`,
            `The public interest and our and our Users’ legitimate interest in
          investigating and stopping the spread of infectious diseases and
          promoting global health. The use and sharing of personal data within
          Upload Data furthers the public interest in the area of public
          health, particularly by helping to protect against serious
          cross-border threats to health. The processing of personal data
          within Upload Data is also necessary for scientific research
          purposes.`,
          ]}
        />
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
          know at <a href="mailto:privacy@idseq.net">privacy@idseq.net</a> and
          we will address it.
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
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>Visitor Data.</span>
              This is information collected from visitors to our website,
              whether or not they are Users (“<b>Visitor Data</b>”).
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>User Data.</span>
              User Data is any information we collect from a User about that
              User (“<b>User Data</b>”). It may include information necessary to
              create or access your account such as your name, username, email
              address, and login credentials.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              When Visitors and Users visit or use our Service, we may
              automatically collect Device Data or Analytics Information. “
              <b>Device Data</b>” includes information about your browser type
              and operating system, IP address and/or device ID, including basic
              analytics from your device or browser. “
              <b>Analytics Information</b>” relates to any of your requests,
              queries, or use of the Services, such as the amount of time spent
              viewing particular web pages. We use{" "}
              <a href="/faqs">Google Analytics</a> for this service. Visitor
              Data may also include information we collect about you when you
              visit our website or use the Services, including through the use
              of cookies, web beacons, and other technologies.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>
                Cookies, Web Beacons, and other Technologies.
              </span>
              A cookie is a small file that may be stored on your computer or
              other device. Web beacons and similar technologies are small bits
              of code embedded in web pages, ads, and email that communicate
              with third parties. We use these technologies to recognize your
              device and browser and do things such as keep you logged in or to
              understand usage patterns by Users and Visitors to our Services.
              We do not use cookies to service third party ads. For more
              information about our cookies use, please see our{" "}
              <a href="/faqs">FAQ</a>.
            </React.Fragment>,
          ]}
        />
        <p className={cs.large}>
          <div className={cs.underlineHeader}>How We Use That Data</div>
        </p>
        <p className={cs.large}>
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
        <p className={cs.large}>
          <div className={cs.underlineHeader}>
            What is our legal basis for using Personal Data in Visitor Data and
            User Data?
          </div>
        </p>
        <p className={cs.large}>
          We (along with CZI (defined below)) have a legitimate interest in
          using personal data within Visitor Data and User Data in the ways
          described in this <a href="/privacy">Privacy Policy</a> to provide,
          protect, and improve IDseq. This allows us to improve the service that
          we provide to Users which, in turn, supports research regarding the
          study of infectious disease with the potential to benefit global
          public health. You can contact us at{" "}
          <a href="mailto:privacy@idseq.net">privacy@idseq.net</a>.
        </p>
        <h2>
          <span className={cs.number}>4.</span>Vendors, and Other Third Parties.
        </h2>
        <p className={cs.large}>
          The Chan Zuckerberg Initiative, LLC (“<b>CZI</b>”) is our primary
          technology partner in building IDseq. CZI helps design, build, and
          operate IDseq. As a result, all data, including any personal data, in
          IDseq is shared with CZI, and it is a joint data controller of all
          personal data in the Service. CZI processes data in accordance with
          this Privacy Notice and access to any data within IDseq by CZI is
          limited to those staff who reasonably need access to operate the
          service.
        </p>
        <p className={cs.large}>
          We also share Upload Data, Report Data, Visitor Data, and User Data
          with service providers, including service providers to CZI, such as
          database providers like Amazon Web Services. We may also share Visitor
          and User data with analytics vendors that assist us to improve and
          optimize IDseq. Learn more about our use of vendors in our{" "}
          <a href="/faqs">FAQ</a>.
        </p>
        <p className={cs.large}>
          If we can no longer keep operating IDseq or believe that its purpose
          is better served by having another entity operating it, we will
          transfer IDseq and all data existing therein (Upload Data, Report
          Data, Visitor Data, and User Data) so that the Users can continue to
          be served. We will always let you know{" "}
          <b>
            <i>before</i>
          </b>{" "}
          this happens, and you will have the option to delete your account and
          any data you’ve uploaded. Should this occur, the entity to which we
          transfer your data will be obliged to use it in a manner that is
          consistent with this Privacy Notice and the Terms.
        </p>
        <p className={cs.large}>
          We may disclose Upload Data, Report Data, Visitor Data, and/or User
          Data if we believe in good faith that such disclosure is necessary (a)
          in connection with any legal investigation; (b) to comply with
          relevant laws or to respond to subpoenas or warrants served on us; (c)
          to protect or defend our rights or property or those of Users; and/or
          (d) to investigate or assist in preventing any violation or potential
          violation of the law, this Privacy Notice, or our Terms.
        </p>
        <h2>
          <span className={cs.number}>5.</span>How We Protect the Information.
        </h2>
        <p className={cs.large}>
          We use industry standard security measures to ensure the
          confidentiality, integrity and availability of data uploaded into
          IDseq. This includes practices like encrypting connections to IDseq
          using TLS, hosting IDseq on leading cloud providers with robust
          physical security, and ensuring that access to any personal data
          within IDseq by CZI and CZ Biohub staff is limited to those staff who
          need access to operate the Service.
        </p>
        <p className={cs.large}>
          Security takes ongoing work and we will continue to monitor and adjust
          our security measures as IDseq develops. Please notify us immediately
          at{" "}
          <a href="mailto:security@idseq.net">
            <b>security@idseq.net</b>
          </a>{" "}
          if you suspect your account has been compromised or are aware of any
          other security issues relating to IDseq.
        </p>
        <h2>
          <span className={cs.number}>6.</span>How Long We Retain Data and Data
          Deletion.
        </h2>
        <p className={cs.large}>
          We retain your personal data only as long as is reasonably necessary:
        </p>
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              Sample Data and Sample Metadata is retained until Users delete it
              from IDseq. Users may submit deletion requests by emailing{" "}
              <a href="mailto:privacy@idseq.net">privacy@idseq.net</a> and we
              will delete the requested Sample Data and corresponding Sample
              Metadata within 60 days.
            </React.Fragment>,
            `Report Data produced by IDseq will be retained on IDseq.`,
            <React.Fragment key={nanoid()}>
              User Data is retained until Users delete their IDseq account as
              such data is required to manage the service. Users may submit
              account deletion requests by emailing{" "}
              <a href="mailto:privacy@idseq.net">privacy@idseq.net</a>. We will
              delete personal data within 60 days following close of your
              account.
            </React.Fragment>,
          ]}
        />
        <p className={cs.large}>
          Please note that we do not control, and so cannot delete, personal
          data that Users have copied outside of IDseq.
        </p>
        <h2>
          <span className={cs.number}>7.</span>Choices About Your Data.
        </h2>
        <p className={cs.large}>
          If you are a User, you have the following choices:
        </p>
        <List
          listItems={[
            `Users are able to request the deletion of User Data that constitutes
          their personal data or Sample Data that they submitted to IDseq.`,
            `Users are able to access and download Report Data relating to Upload
          Data they submitted within IDseq.`,
            <React.Fragment key={nanoid()}>
              Users may also object to the processing of User Data in certain
              circumstances by emailing{" "}
              <a href="mailto:privacy@idseq.net">privacy@idseq.net</a>. In such
              cases, we will stop processing that data unless we have legitimate
              grounds to continue processing it -- for example, it is needed for
              legal reasons.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              Users can also contact us by emailing{" "}
              <a href="mailto:privacy@idseq.net">privacy@idseq.net</a> should
              they wish to access, restrict the processing of, or rectify their
              User Data.
            </React.Fragment>,
          ]}
        />
        <p className={cs.large}>
          If a User has submitted Upload Data containing your personal data,
          please see below:
        </p>
        <List
          listItems={[
            `We require Users who submit Upload Data to ensure they have all
          necessary consents, permissions, and authorizations to do so. We are
          unable to relate Upload Data to identifiable individuals and so
          cannot directly process requests from persons whose personal
          sequencing data may be contained in Upload Data. As a result, IDseq
          is able to receive access, restriction, rectification, objection, or
          deletion requests only from Users.`,
            `If you believe your information has been uploaded to IDseq, you
          should contact the researcher or User that uploaded this information
          to (i) request access to the information, (ii) object to the
          processing of the information, or (iii) seek deletion, restriction,
          or rectification of the information. Similarly, if you previously
          provided consent to a researcher or User, you may have the right to
          withdraw that consent. You should contact the researcher or User to
          make such a withdrawal or otherwise exercise your rights.`,
          ]}
        />
        <p className={cs.large}>
          Please contact us at{" "}
          <a href="mailto:privacy@idseq.net">privacy@idseq.net</a> if you would
          like to exercise the privacy choices discussed above or if you have
          any questions. If your data is subject to the EU data protection law
          (e.g., GDPR) and you wish to raise a concern about our use of your
          information (and without prejudice to any other rights you may have),
          you have the right to do so with your local supervisory authority. You
          can always contact our Data Protection Officer by emailing us at
          contact us at <a href="mailto:privacy@idseq.net">privacy@idseq.net</a>{" "}
          or contacting us as further described in our <a href="/faqs">FAQ</a>.
        </p>
        <h2>
          <span className={cs.number}>8.</span>Data Transfers.
        </h2>
        <p className={cs.large}>
          IDseq is a global service. By using IDseq, Users authorize us to
          transfer and store the uploaded data outside of your home country,
          including to the United States, for the purposes described in this
          Privacy Notice.
        </p>
        <p className={cs.large}>
          If you want to use IDseq, you must first agree to our{" "}
          <a href="/terms">Terms</a>, which set out the contract between IDseq
          and our Users. We operate in countries worldwide (including in the
          United States) and use technical infrastructure in the United States
          to deliver the Services to you. In accordance with the contract
          between us and our Users, we need to transfer personal data to the
          United States and to other jurisdictions as necessary to provide the
          Services. Such transfers are necessary for important reasons of public
          interest, namely global health and providing information which can be
          used by researchers to better understand the spread of infectious
          diseases. Please note that the privacy protections and the rights of
          authorities to access your information in these countries may not be
          the same as in your home country. See our <a href="/faqs">FAQ</a>.
        </p>
        <h2>
          <span className={cs.number}>9.</span>How to Contact Us.
        </h2>
        <p className={cs.large}>
          If you have any questions, comments, or concerns with this Privacy
          Notice, you may contact our Data Protection Officer (DPO) by email at{" "}
          <a href="mailto:privacy@idseq.net">privacy@idseq.net</a> or by
          physical mail at the addresses in the FAQ. You can contact CZI by
          email at{" "}
          <a href="mailto:privacy@chanzuckerberg.com">
            privacy@chanzuckerberg.com
          </a>
          .
        </p>
        <h2>
          <span className={cs.number}>10.</span>Changes to This Privacy Notice.
        </h2>
        <p className={cs.large}>
          This Privacy Notice was last updated on the date above. We may update
          this Privacy Notice from time to time and will provide you with notice
          of material updates before they become effective.
        </p>
      </NarrowContainer>
    );
  }
}
