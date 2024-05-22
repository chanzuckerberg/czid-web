import { nanoid } from "nanoid";
import React from "react";
import { NarrowContainer } from "~/components/layout";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import List from "~/components/ui/List";
import { NEXTCLADE_APP_LINK } from "~/components/utils/documentationLinks";
import cs from "./privacy_notice.scss";

export const PrivacyNotice = () => {
  const renderIntro = () => (
    <>
      <div className={cs.title}>
        <h1>Chan Zuckerberg ID (formerly IDseq) Privacy Policy</h1>
        <h4 className={cs.subtitle}>
          Last Updated: January 1, 2023.{" "}
          <a href="/terms_changes">See Recent Changes</a>
        </h4>
      </div>
      <p>
        The Chan Zuckerberg Biohub Inc. (&quot;CZ Biohub,&quot; &quot;we,&quot;
        &quot; us,&quot; or &quot;our&quot;) in collaboration with the Chan
        Zuckerberg Initiative Foundation (“CZIF”), a 501(c)(3) nonprofit private
        foundation, provides the Chan Zuckerberg ID platform
        (&quot;Services&quot; or &quot;CZ ID&quot;) in partnership with the Chan
        Zuckerberg Initiative, LLC (&quot;CZI&quot;). This Data Privacy Policy
        (&quot;Privacy Policy&quot;) describes the types of information we
        collect or that is uploaded by website visitors (&quot;Visitors&quot;)
        and registered users (&quot;Users&quot;), and how we use, disclose, and
        protect that information.
      </p>
      <p>
        For ease of understanding, we’ve created the below Summary Table, which
        pulls out some key points. More details can be found in our{" "}
        <a href="/faqs">FAQ</a>, as well as the full Privacy Policy below and
        the <a href="/terms">Terms of Use</a> (“Terms”) that applies to your use
        of CZ ID.
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
            <td colSpan={5}>
              <b>Data you upload to or create using CZ ID</b>
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
              filtered out in order to generate Reports. We always filter out
              all human genetic information, regardless of host. We use the
              remaining data, with Sample Metadata, to create Reports and
              Visualizations showing the microorganisms in your sample. These
              Reports and Visualizations can be shared with other CZ ID users.
            </td>
            <td>
              Raw Sample Data is not shared with any other CZ ID user, nor is it
              ever accessed by anyone working on CZ ID unless specifically
              requested by a User, such as to debug an issue. This data is
              disclosed to our service providers (ex: AWS) in order to operate
              and secure the service.
            </td>
            <td rowSpan={4}>
              Users can request deletion of Raw Sample Data or their CZ ID
              account data by contacting us at{" "}
              <a href="mailto:privacy@czid.org">privacy@czid.org</a> and we will
              fulfill the request within the timelines set forth under
              applicable privacy laws. You can learn more about your choices in
              the Section titled, “Choices About Your Data.”
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
                  Sample Metadata. CZ ID Users may choose to share that Report
                  Data and/or Visualizations (including Sample Metadata) with
                  other CZ ID Users.
                </p>
                <br />
                <p>
                  This data is also shared with technical partners (Chan
                  Zuckerberg Initiative, LLC - CZI LLC) and service providers
                  (ex: AWS) that help operate, improve, and secure CZ ID. CZI
                  LLC and service providers are limited by this Privacy Policy
                  and will not use any data shared with them for any purpose
                  beyond operating, improving, and securing CZ ID.
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
            <td colSpan={5}>
              <b>Data CZ ID collects</b>
            </td>
          </tr>
          <tr className={cs.contentRow}>
            <td>
              <b>User Data</b>
            </td>
            <td>
              Data about researchers with CZ ID accounts such as name, email,
              institution, basic information about how they are using CZ ID (ex:
              search queries), and information provided through surveys, during
              an in-person event, or for user support (ex: resolving support
              requests).
            </td>
            <td>
              We use this data only to operate, secure, and improve the CZ ID
              services.
            </td>
            <td>
              <div>
                <p>
                  Basic CZ ID account information such as name and institution
                  may be visible to other CZ ID Users (ex: with collaborators on
                  a shared project).
                </p>
                <br />
                <p>
                  This data is also shared with technical partners (CZI LLC) and
                  service providers (ex: AWS) that help operate, improve, and
                  secure CZ ID.
                </p>
                <br />
                <p>
                  CZI LLC and service providers are limited by this Privacy
                  Policy and will not use any data shared with them for any
                  purpose beyond operating, improving, and securing CZ ID.
                </p>
                <br />
                <p>
                  We will never sell your data or share it with anyone that
                  does.
                </p>
              </div>
            </td>
            <td rowSpan={2}>
              Users can request deletion of their CZ ID account data by
              contacting us at{" "}
              <a href="mailto:privacy@czid.org">privacy@czid.org</a> and we will
              fulfill the request within the timelines set forth under
              applicable privacy laws. You can learn more about your choices in
              the Section titled, “Choices About Your Data.”
            </td>
          </tr>
          <tr className={cs.contentRow}>
            <td>
              <b>Device and Analytics Data</b>
            </td>
            <td>
              Device Data (ex: browser type, operating system, and IP address)
              and Analytics Information (ex: links within CZ ID you click on and
              how often you log into CZ ID) includes basic information about how
              Users and Visitors are interacting with CZ ID and a general
              location (i.e. country) of where they are accessing the Services.
            </td>
            <td>See above.</td>
            <td>See above.</td>
          </tr>
          <tr className={cs.contentRow}>
            <td>
              <b>Visitor Data</b>
            </td>
            <td>
              Data about visitors (non-Users) to CZ ID pages, such as czid.org
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

  const renderAboutCZID = () => (
    <>
      <h3>About CZ ID</h3>
      <p>
        CZ ID is an online platform designed to enable the research community to
        research pathogens in metagenomic sequencing and to help further the
        study of infectious diseases. To do this, CZ ID processes genetic data
        in order to identify pathogens contained within.
      </p>
      <p>
        Here’s how CZ ID works: Users submit Upload Data (as described below).
        This data may contain human and non-human genetic sequences (“Raw Sample
        Data”; as further defined below), as well as information about those
        sequences, such as the date the sample was collected and the host
        species it was collected from (“Sample Metadata” as further defined
        below). For example, a researcher might upload genetic information from
        mosquitoes, which are often a source of infectious disease, or from
        humans, who can be infected by such diseases. CZ ID then processes this
        Upload Data in order to identify pathogens found within the genetic
        sequence (e.g., the mosquito may be carrying the chikungunya virus).
      </p>
      <p>
        We hope that this sharing of pathogen data will help to create a global
        dashboard that helps researchers better understand pathogens.
      </p>
      <p>
        CZ ID also collects information about Users in order to offer and
        improve the Service. Other than basic information required to create an
        account (e.g. email address, name), the User determines what information
        they want to upload onto CZ ID. Please note: CZ ID is not designed for
        or directed toward children under the age of sixteen and we do not have
        actual knowledge that we have sold or shared the personal information of
        users under 16 years of age. If we become aware that we have the
        information of such children collected through CZ ID, we will promptly
        delete it.
      </p>
      <h2>Data CZ ID Collects</h2>
      <p>
        We will never share your personal information for behavioral advertising
        purposes nor will we ever sell your personal information. We do collect,
        use, and retain your data as follows:
      </p>
    </>
  );

  const renderUploadDataPolicy = () => (
    <>
      <h2>
        <span className={cs.number}>1.</span>Upload Data.
      </h2>
      <p>
        “Upload Data” is data that Users upload to CZ ID (other than the
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
        <div className={cs.underlineHeader}>Sensitive Personal Information</div>
      </p>
      <p>
        Raw Sample Data a User uploads from a human host is sensitive personal
        information (genetic sequence data) and we collect this information to
        operate and provide the requested service to you.
      </p>
      <p>
        <div className={cs.underlineHeader}>How We Use Upload Data</div>
      </p>
      <p>Upload Data is used for the following business purposes:</p>
      <List
        listItems={[
          `To create Report Data (described below), including new reports for
        Users when we update our Data Pipeline.`,
          `To improve the way CZ ID creates Report Data, including improving
        our Data Pipeline.`,
          `To debug in the event you reach out to us with a specific issue related to your Upload Data. `,
        ]}
      />
      <p>
        We will never sell your data or share it with anyone that does nor will
        we share your personal information for behavioral advertising purposes.
      </p>
      <p>
        <div className={cs.underlineHeader}>How We Share Upload Data</div>
      </p>
      <p>
        Raw Sample Data is <b>never</b> disclosed to any other CZ ID User other
        than the User that uploaded the Sample, but it is disclosed to service
        providers in order to provide the Services, such as AWS for data
        storage. Even staff working on CZ ID cannot access this information
        except as specifically instructed by a User, such as to debug an issue.
      </p>
      <p>
        In order to advance CZ ID&apos;s goal of creating a global pathogen
        dashboard for researchers, Users will have the option (at their
        discretion) to share Report Data and Sample Metadata with all CZ ID
        Users. Users can also choose to share their Report Data and Sample
        Metadata by creating Projects (groups of Reports) and sharing those
        Projects with other CZ ID Users.
      </p>
      <p>
        If you have questions about how this to share your Report Data and
        Sample Metadata, then please reach out to{" "}
        <a href="mailto:help@czid.org">help@czid.org</a>.
      </p>
      <p>
        <div className={cs.underlineHeader}>
          What’s our legal basis to use and disclose Upload Data?
        </div>
      </p>
      <p>
        To the extent that the European Union’s General Data Protection
        Regulation (“GDPR”) applies, we rely on the following legal bases to use
        and disclose personal data within Upload Data:
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
        Report Data is information CZ ID produced from Upload Data. We generate
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
        sequence data in any Reports in CZ ID, please let us know at{" "}
        <a href="mailto:privacy@czid.org">privacy@czid.org</a> and we will
        address it.
      </p>
      <p>
        <div className={cs.underlineHeader}>Who can see Report Data?</div>
      </p>
      <p>
        As mentioned above in Section 1 (How We Disclose Upload Data), Users can
        choose to share their Report Data by creating Projects (groups of
        Reports) and share those Projects with other CZ ID Users or Users can
        decide to share it more broadly with all CZ ID Users by marking a
        Project as “Public.” This <b>does not</b> include Raw Sample Data -
        those genetic sequence files are available only to the User that
        uploaded the Sample.
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
        use of CZ ID.
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
            such as identifiers and professional or employment-related
            information (“User Data”). It may include information necessary to
            create or access your account such as your name, username, email
            address, and login credentials. This could also include information
            we collect if you decide to respond to a voluntary survey or join us
            for an in-person event.
          </React.Fragment>,
          <React.Fragment key={nanoid()}>
            <span className={cs.listItemLabel}>Device and Analytics Data.</span>
            When Visitors and Users visit or use our Service, we may
            automatically collect Device Data or Analytics Information which
            includes internet or other electronic network activity and
            geolocation data. “Device Data” includes information about your
            browser type and operating system, IP address and/or device ID,
            including basic analytics from your device or browser. “Analytics
            Information” relates to any of your requests, queries, or use of the
            Services, such as the amount of time spent viewing particular web
            pages. We use service providers for this service. Learn more in our{" "}
            <a href="/faqs">FAQ</a>.
          </React.Fragment>,
          <React.Fragment key={nanoid()}>
            <span className={cs.listItemLabel}>
              Cookies, Web Beacons, and other Technologies.
            </span>
            A cookie is a small file that may be stored on your computer or
            other device. Web beacons and similar technologies are small bits of
            code embedded in web pages or an email, for example, that
            communicate with third parties. We use these technologies to
            recognize your device and browser and do things such as keep you
            logged in or to understand usage patterns by Users and Visitors to
            our Services. We do not use cookies to service third party ads. For
            more information about our use of cookies, please see our{" "}
            <a href="/faqs">FAQ</a>.
          </React.Fragment>,
        ]}
      />
      <p>
        <div className={cs.underlineHeader}>How We Use That Data</div>
      </p>
      <p>
        Visitor Data and User Data (including any personal data in the Visitor
        Data and User Data) will be used for the following business purposes:
      </p>
      <List
        listItems={[
          `To identify you, create a profile for Users, and verify User’s
          identity so you can log in to and use CZ ID.`,
          `To provide you with notices about your account and updates about
          CZ ID.`,
          `To respond to your inquiries and requests.`,
          `To learn about what Users find valuable with CZ ID, to analyze how Users are using CZ ID, and to learn the general location (i.e., country) of where Users are accessing the Service so we can optimize and improve it.`,
          `To protect the security and integrity of CZ ID.`,
        ]}
      />
      <p>
        <div className={cs.underlineHeader}>
          What is our legal basis for using personal data in Visitor Data and
          User Data?
        </div>
      </p>
      <p>
        To the extent that the GDPR applies, we rely on the following legal
        bases to use and disclose personal data in Visitor and User Data:
      </p>
      <List
        listItems={[
          `We (along with CZIF and CZI LLC) have a legitimate interest in using personal
        data within Visitor Data and User Data in the ways described in this
        Privacy Policy to operate, secure, and improve CZ ID. This allows us to
        improve the service that we provide to Users which, in turn, supports
        research regarding the study of infectious disease with the potential to
              benefit global public health.`,
          `We rely on consent as a legal basis when processing data through the use of cookies when required under applicable law.`,
        ]}
      />
    </>
  );
  const renderHowLongWeRetainData = () => (
    <>
      <h2>
        <span className={cs.number}>4.</span>How Long We Retain Data and Data
        Deletion.
      </h2>
      <p>We retain your personal data as long as is reasonably necessary:</p>
      <List
        listItems={[
          `Raw Sample Data, Sample Metadata, and Report Data is retained until Users delete it from CZ ID. Users may submit deletion requests by emailing privacy@czid.org and we will delete the requested Raw Sample Data and corresponding Report Data (including Sample Metadata) within the timelines set forth under applicable privacy laws.`,
          `User Data is retained until Users close their CZ ID account as such data is required to manage the service. Users may submit a request for account closure by emailing privacy@czid.org. We will delete your data within 60 days following the close of your account.`,
        ]}
      />
      <p>
        Please note that we do not control, and so cannot delete, personal data
        that Users have copied outside of CZ ID.
      </p>
    </>
  );

  const renderVendorAndThirdPartyPolicy = () => (
    <>
      <h2>
        <span className={cs.number}>5.</span>Vendors and Service Providers.
      </h2>
      <p>
        CZ Biohub and CZIF collaborate closely in order to build, design, and
        operate CZ ID so that it can be as useful as possible to researchers and
        the public health community. CZI LLC is our primary technology partner,
        focusing on CZ ID infrastructure, security, and compliance. The three
        parties are all data controllers for data within CZ ID and will use data
        only as described in this Privacy Policy.
      </p>
      <p>
        We also disclose Upload Data, Report Data, Visitor Data, and User Data
        with service providers, including service providers to CZI LLC, such as
        database providers like Amazon Web Services, customer support providers
        like Zendesk, and survey providers. We may also share Visitor and User
        data with analytics vendors that assist us to improve and optimize CZ
        ID. To learn more about our vendors we use, please see our{" "}
        <a href="/faqs">FAQ</a> or contact us at{" "}
        <a href="mailto:privacy@czid.org">privacy@czid.org</a>.
      </p>
      <p>
        If we can no longer keep operating CZ ID or believe that its purpose is
        better served by having another entity operating it, we will transfer CZ
        ID and all data existing therein (Upload Data, Report Data, Visitor
        Data, and User Data) so that the Users can continue to be served. We
        will always let you know before this happens, and you will have the
        option to delete your account and any data you’ve uploaded prior to any
        such transfer. Should this occur, the entity to which we transfer your
        data will be obliged to use it in a manner that is consistent with this
        Privacy Policy and the Terms.
      </p>
      <p>
        We may disclose Upload Data, Report Data, Visitor Data, and/or User Data
        if we believe in good faith that such disclosure is necessary (a) in
        connection with any legal investigation; (b) to comply with relevant
        laws or to respond to subpoenas or warrants served on us; (c) to protect
        or defend our rights or property or those of Users; and/or (d) to
        investigate or assist in preventing any violation or potential violation
        of the law, this Privacy Policy, or our Terms.
      </p>
    </>
  );

  const renderInformationProtectionPolicy = () => (
    <>
      <h2>
        <span className={cs.number}>6.</span>How We Protect the Information.
      </h2>
      <p>
        We use industry standard security measures to ensure the
        confidentiality, integrity and availability of data uploaded into CZ ID.
        This includes practices like encrypting connections to CZ ID using TLS,
        hosting CZ ID on leading cloud providers with robust physical security,
        and ensuring that access to any personal data within CZ ID by staff
        working on the tool is strictly limited. And as mentioned above, Raw
        Sample Data is <b>not shared</b> with anyone other than the User that
        uploaded the Sample or the service providers necessary to operate the
        service. Even staff working on CZ ID cannot access this information
        except as specifically instructed by a User, such as to debug an issue.
      </p>
      <p>
        Security takes ongoing work and we will continue to monitor and adjust
        our security measures as CZ ID develops. For more information you can
        take a look at the{" "}
        <a href="https://czid.org/security_white_paper">
          CZ ID Security White Paper
        </a>{" "}
        which provides details regarding our infrastructure, application, and
        physical security, as well as our security governance and policies.
        Please notify us immediately at{" "}
        <a href="mailto:security@czid.org">security@czid.org</a> if you suspect
        your account has been compromised or are aware of any other security
        issues relating to CZ ID.
      </p>
    </>
  );

  const renderUserDataChoicesPolicy = () => (
    <>
      <h2>
        <span className={cs.number}>7.</span>Choices About Your Data.
      </h2>
      <p>If you are a User, you have the following choices and rights:</p>
      <List
        listItems={[
          `Users are able to request the deletion of User Data that constitutes their personal data or Raw Sample Data that they submitted to CZ ID.`,
          `Users are able to access and download Report Data relating to Upload Data they submitted within CZ ID.`,
          <>
            Users may also object to the processing of User Data in certain
            circumstances by emailing{" "}
            {<a href="mailto:privacy@czid.org">privacy@czid.org</a>}. In such
            cases, we will stop processing that data unless we have legitimate
            grounds to continue processing it -- for example, it is needed for
            legal reasons.
          </>,
          <>
            Users can also contact us by emailing{" "}
            {<a href="mailto:privacy@czid.org">privacy@czid.org</a>} should they
            wish to access, restrict the processing of, or rectify their User
            Data.
          </>,
        ]}
      />
      <p>
        If a User has submitted Upload Data containing your personal data,
        please see below:
      </p>
      <List
        listItems={[
          `We require Users who submit Upload Data to ensure they have all necessary consents, permissions, and authorizations to do so. We are unable to relate Upload Data to identifiable individuals and so cannot directly process requests from persons whose personal sequencing data may be contained in Upload Data. As a result, CZ ID is able to receive access, restriction, rectification, objection, or deletion requests only from Users.`,
          `If you believe your information has been uploaded to CZ ID, you should contact the researcher or User that uploaded this information to (i) request access to the information, (ii) object to the processing of the information, or (iii) seek deletion, restriction, or rectification of the information. Similarly, if you previously provided consent to a researcher or User, you may have the right to withdraw that consent. You should contact the researcher or User to make such a withdrawal or otherwise exercise your rights.`,
        ]}
      />
      <p>
        Please contact us at{" "}
        <a href="mailto:privacy@czid.org">privacy@czid.org</a> if you would like
        to exercise the privacy choices discussed above or if you have any
        questions. We may ask for additional information that allows us to
        reasonably verify that you are the person about whom we collected
        personal information. If you would like an authorized agent to make a
        request for you, have that agent email{" "}
        <a href="mailto:privacy@czid.org">privacy@czid.org</a> with information
        that is sufficient for us to verify that the authorized agent is acting
        on your behalf. If you would like to appeal a decision with respect to a
        request to exercise any of these rights, please email us at
        <a href="mailto:privacy@czid.org">privacy@czid.org</a> and explain the
        basis for your appeal. If your data is subject to the EU data protection
        law (e.g., GDPR) and you wish to raise a concern about our use of your
        information (and without prejudice to any other rights you may have),
        you have the right to do so with your local supervisory authority or by
        emailing us at <a href="mailto:privacy@czid.org">privacy@czid.org</a>.
      </p>
    </>
  );
  const renderDoNotTrackSignals = () => (
    <>
      <h2>
        <span className={cs.number}>8.</span>Do Not Track Signals.
      </h2>
      <p>
        We don’t share personal data with third parties for their direct
        marketing purposes or behavioral advertising and never will, nor do we
        support any Do Not Track signals since there’s currently no standard for
        how online services respond to those signals. As standards develop, we
        may establish policies for responding to DNT signals that we would
        describe in this Privacy Policy. You can learn more about DNT{" "}
        <a href="https://allaboutdnt.com/"> here</a>.
      </p>
    </>
  );
  const renderDataTransferPolicy = () => (
    <>
      <h2>
        <span className={cs.number}>9.</span>Data Transfers.
      </h2>
      <p>
        CZ ID is a global service. By using CZ ID, Users authorize us to
        transfer and store the uploaded data outside of your home country,
        including to the United States, for the purposes described in this
        Privacy Policy.
      </p>
      <p>
        If you want to use CZ ID, you must first agree to our{" "}
        <a href="/terms">Terms</a>, which set out the contract between CZ ID and
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

  const renderAdditionalInformationForCalifornia = () => (
    <>
      <h2>
        <span className={cs.number}>10.</span>Additional Information For
        California Residents
      </h2>
      <p>
        The California Consumer Privacy Act (“CCPA”) requires certain businesses
        to give California residents a number of rights regarding their personal
        information. We are offering these rights to you, including the right to
        have your personal information deleted (subject to certain exceptions),
        the right to change or correct your personal information, the right to
        limit the use or disclosure of your sensitive personal information (if
        applicable), the right to access your personal information, the right to
        opt-out of the “selling” or “sharing” of personal information (if
        applicable), and the right not to be discriminated against for
        exercising these rights.
      </p>
      <p>
        These rights, and how to exercise them, are described in more detail in
        the Section titled “Choices About Your Data” of this Policy Policy. In
        addition to these rights, we give you a right to request the following
        information about your personal information that we have collected in
        the past 12 months:
      </p>
      <p>
        <strong>The Right to Know.</strong> This right allows you to request the
        following information about the personal information that we’ve
        collected about you in the past 12 months:
      </p>
      <p>
        <strong>Information about Data Collection</strong>
      </p>
      <List
        listItems={[
          `The categories of personal information that have been collected.`,
          `The categories of sources from which we have collected personal information.`,
          `The business purpose for which we have collected personal information.`,
        ]}
      />
      <p>
        <strong>Information about Data Disclosure</strong>
      </p>
      <List
        listItems={[
          `The categories of personal information, if any, that have been sold, shared, or disclosed for a business purpose to third parties.`,
          `"The categories of third parties to whom personal information was sold (if applicable), shared, or disclosed for a business purpose. Note: CZ ID does not share your personal information for behavioral advertising purposes nor will we ever sell your personal information.`,
        ]}
      />
      <p>
        We have described in fuller detail in this Privacy Policy the personal
        information that we collect, how we use, and disclose it, but provide
        the following additional disclosure:
      </p>
      <p>
        <strong>Information about Data Collection</strong>
      </p>
      <List
        listItems={[
          <>
            <strong>Information we collect.</strong>{" "}
            {`We have collected the following categories of personal information from consumers within the past 12 months: (1) identifiers; (2) professional or employment-related information, (3) internet or other electronic network activity within CZ ID; (4) geolocation data; (5) User uploaded genetic data; (6) inferences drawn from your internet or other electronic network activity within CZ ID; and (7) information provided within survey responses.`}
          </>,
          <>
            <strong>Sources of information.</strong>{" "}
            {`We obtain identifiers, professional or employment-related information, information provided within survey responses, and the genetic data Users upload directly from you. We obtain the other categories of personal information from the sources described in the Section 3 above.`}
          </>,
          <>
            <strong>Purposes of collection.</strong>{" "}
            {`We collect personal information for one or more of the business purposes as described in Sections 1 through 3 above.`}
          </>,
        ]}
      />
      <p>
        <strong>Information about Data Disclosure</strong>
      </p>
      <List
        listItems={[
          <>
            <strong>Information we disclose.</strong>{" "}
            {`We have disclosed the following categories of personal information in order to provide the Service within the past 12 months: (1) identifiers; (2) professional or employment-related information, (3) internet or other electronic network activity within CZ ID; (4) geolocation data; (5) User uploaded genetic data; (6) inferences drawn from your internet or other electronic network activity within CZ ID; and (7) information provided within survey responses.`}
          </>,
          <>
            <strong>Third parties to whom we disclose.</strong>{" "}
            {`The categories of third parties to whom we have disclosed this personal information are described in the Section titled “Vendors and service providers” in this Privacy Policy.`}
          </>,
          <>
            <strong>Purposes of disclosure.</strong>{" "}
            {`We disclose the personal information we collect about you for one or more of the business purposes as described in Sections 1 through 3 above.`}
          </>,
          <>
            <strong>Sensitive data.</strong>{" "}
            {`We do collect sensitive personal information as described in Section 1 above and only disclose it for the purpose of providing the requested service to you.`}
          </>,
        ]}
      />
    </>
  );

  const renderAdditionalInformationForVirginia = () => (
    <>
      <h2>
        <span className={cs.number}>11.</span>Additional Information for
        Residents of Virginia, Colorado, Connecticut, and Utah.
      </h2>
      <p>
        Virginia, Colorado, Connecticut, and Utah also have adopted privacy laws
        that give consumers certain rights, including the right to confirm
        whether controllers are processing the consumer’s personal data, the
        right to access that data, the right to obtain a copy of that data, the
        right to correct inaccuracies in that data, and the right to delete that
        data. As discussed above in the Section titled “Choices About Your
        Data,” we provide these rights to all consumers, regardless of where
        they reside.
      </p>
      <p>
        Additionally, these four states have adopted rights to opt-out of: (1)
        targeted advertising; (2) the sale of personal data; and (3) profiling
        in furtherance of decisions that produce legal or similarly significant
        effects concerning the consumer. We do not sell your data, use it for
        targeted advertising, or to profile you in furtherance of decisions that
        produce legal or similarly significant effects.
      </p>
    </>
  );

  const renderExternalLinks = () => (
    <>
      <h2>
        <span className={cs.number}>12.</span>External Links.
      </h2>
      <p>
        We may link to another company’s website (e.g., Nextclade as mentioned
        above), which may have different policies than us. We aren’t responsible
        for their policies or content so we recommend you read their policies if
        you decide to use their service.{" "}
      </p>
    </>
  );

  const renderContactInfo = () => (
    <>
      <h2>
        <span className={cs.number}>13.</span>How to Contact Us.
      </h2>
      <p>
        If you have any questions, comments, or concerns with this Privacy
        Policy, you may contact our Data Protection Officer (DPO) by email at{" "}
        <a href="mailto:privacy@czid.org">privacy@czid.org</a> or by physical
        mail at the addresses below.
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

  const renderChangesToPrivacyPolicy = () => (
    <>
      <h2>
        <span className={cs.number}>14.</span>Changes to This Privacy Policy.
      </h2>
      <p className={cs.last}>
        {`This Privacy Policy was last updated on the "Last Updated" date. We may
        update this Privacy Policy from time to time and will provide you with
        notice of any material updates before they become effective.`}
      </p>
      <div style={{ height: "50px" }} />
    </>
  );

  return (
    <NarrowContainer className={cs.privacyPolicy} size="small">
      {renderIntro()}
      {renderSummaryTable()}
      {renderAboutCZID()}
      {renderUploadDataPolicy()}
      {renderReportDataPolicy()}
      {renderVisitorAndUserDataPolicy()}
      {renderHowLongWeRetainData()}
      {renderVendorAndThirdPartyPolicy()}
      {renderInformationProtectionPolicy()}
      {renderUserDataChoicesPolicy()}
      {renderDoNotTrackSignals()}
      {renderDataTransferPolicy()}
      {renderAdditionalInformationForCalifornia()}
      {renderAdditionalInformationForVirginia()}
      {renderExternalLinks()}
      {renderContactInfo()}
      {renderChangesToPrivacyPolicy()}
    </NarrowContainer>
  );
};
