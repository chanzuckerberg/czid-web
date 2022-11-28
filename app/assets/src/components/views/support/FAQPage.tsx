import { nanoid } from "nanoid";
import React from "react";
import { Accordion, NarrowContainer } from "~/components/layout";
import List from "~/components/ui/List";
import cs from "./support.scss";

export default class FAQPage extends React.Component {
  render() {
    return (
      <NarrowContainer className={cs.faqPage} size="small">
        <div className={cs.title}>
          <h1>Frequently Asked Questions</h1>
        </div>
        <Accordion
          className={cs.question}
          header={<h3>Does CZ ID own any of the data I upload to the tool?</h3>}
        >
          <p>
            No. The data you upload into CZ ID is yours and so is any research
            you create with it. We don’t own it and will never sell it. You do,
            however, give us limited rights to use it for the CZ ID service.
          </p>
        </Accordion>
        <Accordion
          className={cs.question}
          header={<h3>Does CZ ID sell the data I upload?</h3>}
        >
          <p>No.</p>
        </Accordion>
        <Accordion
          className={cs.question}
          header={
            <h3>How does CZ ID share the data I upload with other users?</h3>
          }
        >
          <List
            listItems={[
              <React.Fragment key={nanoid()}>
                When you upload data to CZ ID, you control who the data is
                shared with. CZ ID relies on three key categories of data, and
                we want you to understand how each is treated.{" "}
                <b>Upload Data</b> refers to the original fastq sequence files
                you upload into CZ ID-- this data will only be available to you,
                the uploader, no matter who you add to the project.{" "}
                <b>Sample Metadata</b> includes details about the sample that
                researchers manually enter, such as when and where a sample was
                collected and its type (e.g. synovial fluid or cerebrospinal
                fluid). <b>Report Data</b> includes the pathogen report CZ ID
                generates from the Upload Data, Sample Metadata, and other data
                derived from the Upload, such as phylogenetic trees.
              </React.Fragment>,
              <React.Fragment key={nanoid()}>
                <b>Report Data</b> and <b>Sample Metadata</b> will be shared
                with anyone you share your project with.
              </React.Fragment>,
              <React.Fragment key={nanoid()}>
                You can decide to share your Report Data and the associated
                Sample Metadata with all CZ ID users but that is completely up
                to you. You can choose to share your Report Data with a small
                group of CZ ID users, by adding them to a Project, or with all
                other CZ ID users by marking a Project as {'"Public"'}.
              </React.Fragment>,
            ]}
          />
        </Accordion>
        <Accordion
          className={cs.question}
          header={
            <h3>Will CZ ID use my Upload Data to write research papers?</h3>
          }
        >
          <p>No, we will not.</p>
        </Accordion>
        <Accordion
          className={cs.question}
          header={<h3>How is human genomic data handled and protected?</h3>}
        >
          <List
            listItems={[
              <React.Fragment key={nanoid()}>
                You should not be able to find any human sequence data in CZ ID
                other than the original fastq files you yourself have uploaded.
                This is because we have a multi-step process in place to filter
                out and remove host sequence data in order to generate Reports.
                If you are able to find human sequence data elsewhere in CZ ID,
                please let us know at{" "}
                <a href="mailto:privacy@czid.org">privacy@czid.org</a>, and we
                will remove it. The fastq files you uploaded are only available
                to you, the uploader.
              </React.Fragment>,
              <React.Fragment key={nanoid()}>
                For the fastq files you yourself have uploaded, we understand
                this data is sensitive and we implement security measures
                designed to safeguard it. We seek to implement security best
                practices like encrypting data, hosting it on leading cloud
                providers with robust physical security, regular security
                assessments, data loss prevention systems, and working to ensure
                that only authorized staff have access to the data. If you need
                more information about our security practices please contact us
                at <a href="mailto:security@czid.org">security@czid.org</a>.
              </React.Fragment>,
            ]}
          />
        </Accordion>
        <Accordion
          className={cs.question}
          header={<h3>Can I use CZ ID for clinical diagnostic purposes?</h3>}
        >
          <p>
            No. CZ ID is for research use only. It is not for diagnostic,
            clinical or commercial use.
          </p>
        </Accordion>
        <Accordion
          className={cs.question}
          header={
            <h3>What should I think about before uploading data to CZ ID?</h3>
          }
        >
          <p>
            You should make sure you have any permissions or consents necessary
            in order to upload the samples to CZ ID. Please check with your
            institution or organization if you have questions about meeting this
            responsibility.
          </p>
        </Accordion>
        <Accordion
          className={cs.question}
          header={
            <h3 className={cs.multiLine}>
              What Metadata about the uploaded samples do you collect, and how
              do you make sure the metadata is non-identifiable?
            </h3>
          }
        >
          <List
            listItems={[
              <React.Fragment key={nanoid()}>
                We require 4 metadata fields for uploaded samples. We believe
                these data are necessary to fully analyze the data. The 4 fields
                we require are:
                <div className={cs.innerListItem}>
                  1. Sample type (CSF, Stool, Serum, etc)
                </div>
                <div className={cs.innerListItem}>
                  2. Nucleotide type (RNA or DNA)
                </div>
                <div className={cs.innerListItem}>
                  3. Location (limited to state or country)
                </div>
                <div className={cs.innerListItem}>
                  4. Collection Date (limited to month and year)
                </div>
              </React.Fragment>,
              <React.Fragment key={nanoid()}>
                We limit the granularity of location and collection date to help
                maintain the anonymity of the uploaded data.
              </React.Fragment>,
              <React.Fragment key={nanoid()}>
                Other metadata can be uploaded to CZ ID but is not required and
                may be deleted at any point. We have put together a metadata
                ontology that you can find{" "}
                <a href="/metadata/dictionary">here</a> that does not include
                any fields where Protected Health Information (PHI) can be
                derived.
              </React.Fragment>,
            ]}
          />
        </Accordion>
        <Accordion
          className={cs.question}
          header={
            <h3 className={cs.multiLine}>
              Under what circumstances would CZ ID transfer rights to the data?
              Why, and what choices would I have?
            </h3>
          }
        >
          <p>
            If we can no longer keep operating CZ ID (which we hope won’t
            happen) or believe the community is better served by someone else
            operating it, we will transfer the project and all existing data in
            the tool so that the community can continue to be served. We will
            always let you know before something like this happens, and you will
            have the option to delete your account and any data you’ve uploaded.
          </p>
        </Accordion>
        <Accordion
          className={cs.question}
          header={<h3>Where do I go for more questions?</h3>}
        >
          <p>
            Please contact{" "}
            <a href="mailto:security@czid.org">security@czid.org</a> if you have
            any security-related questions or concerns, and{" "}
            <a href="mailto:privacy@czid.org">privacy@czid.org</a> if you have
            any other questions about our practices or legal documents.
          </p>
        </Accordion>
        <Accordion
          className={cs.question}
          header={<h3>What is your address?</h3>}
        >
          <List
            listItems={[
              `Chan Zuckerberg Biohub, 499 Illinois Street, Fourth Floor San
              Francisco, CA 94158`,
              `Chan Zuckerberg Initiative, LLC, 601 Marshall St., Redwood City,
              CA 94063`,
            ]}
          />
        </Accordion>
        <Accordion
          className={cs.question}
          header={<h3>Do you use Cookies in CZ ID?</h3>}
        >
          <p>
            Yes, we use cookies and similar technologies to provide and improve
            the CZ ID service. We do not use cookies for advertising purposes.
          </p>
          <p>
            Cookies are small text files sent by your computer or device each
            time you visit our website. They are stored in your browser’s cache
            or mobile device and allow a website or a third party to recognize
            your browser. Some of the cookies we use are associated with your CZ
            ID account (including information about you, such as the email
            address you gave us) and other cookies are not. We use three
            different types of cookies:
          </p>
          <List
            listItems={[
              <React.Fragment key={nanoid()}>
                <span className={cs.listItemLabel}>Session cookies</span> are
                specific to a particular visit you make to CZ ID and hold
                certain information as you browse different pages so you don’t
                have to re-enter information every time you change pages.
                Session cookies expire and delete themselves automatically in a
                short period of time like after you leave CZ ID or when you
                close your web browser.
              </React.Fragment>,
              <React.Fragment key={nanoid()}>
                <span className={cs.listItemLabel}>Persistent cookies</span>{" "}
                remember certain information about your preferences for viewing
                CZ ID and allow us to recognize you each time you return.
                Persistent cookies are stored on your browser cache or mobile
                device until you choose to delete them, and otherwise delete
                themselves in a standard period of time.
              </React.Fragment>,
              <React.Fragment key={nanoid()}>
                <span className={cs.listItemLabel}>Third party cookies</span>{" "}
                are a type of persistent cookie and are placed by someone other
                than us. These cookies may gather browsing activity across
                multiple websites and across multiple sessions. They are stored
                until you delete them or expire based on the time period set in
                each third party cookie.
              </React.Fragment>,
            ]}
          />
          <p>
            We partner with third-party analytics providers (such as Google and
            Segment), which set cookies when you visit our websites. These
            cookies collect information, such as how often users visit our
            websites, what pages they visit, and what other sites they used
            prior to coming to our websites. We use this information to improve
            our Services. Please see how you can control or limit how we and our
            partners use cookies below, under “Do I have choices with respect to
            cookies?”
          </p>
        </Accordion>
        <Accordion
          className={cs.question}
          header={<h3>Why do you use cookies?</h3>}
        >
          <p>
            We use cookies to help operate and make our Services function
            securely:
          </p>
          <List
            listItems={[
              <React.Fragment key={nanoid()}>
                <span className={cs.listItemLabel}>
                  Authentication and security.
                </span>{" "}
                Cookies and similar technologies help us verify your account and
                device to maintain the security, safety, and integrity of our
                Services. For example, we use cookies to help prevent the
                fraudulent use of your login credentials.
              </React.Fragment>,
              <React.Fragment key={nanoid()}>
                <span className={cs.listItemLabel}>
                  Account and user preferences.
                </span>{" "}
                We use some technologies to remember your account and
                preferences over time so that we can make it easier for you to
                access the Services and provide you with the experiences and
                features you desire. For example, we use cookies to persist some
                report filtering settings.
              </React.Fragment>,
              <React.Fragment key={nanoid()}>
                <span className={cs.listItemLabel}>
                  Performance and analytics.
                </span>{" "}
                Cookies and similar technologies help us analyze how the
                Services are being accessed and used, and enable us to track the
                performance of the Services. This gives us the information we
                need to improve your experience on our Services.
              </React.Fragment>,
            ]}
          />
        </Accordion>
        <Accordion
          className={cs.question}
          header={<h3>Do I have choices with respect to cookies?</h3>}
        >
          <p>
            You have options to control or limit how we and our partners use
            cookies and similar technologies.
          </p>
          <List
            listItems={[
              `Although most browsers and devices accept cookies by default,
              their settings usually allow you to clear or decline cookies. Note
              that if you disable cookies, however, some of the features of our
              Services may not function properly.`,
              <React.Fragment key={nanoid()}>
                To learn more about how to opt out of Google’s use of cookies
                either as part of AdWords or Analytics services, you may visit{" "}
                <a href="https://adssettings.google.com/">
                  Google’s Ads Settings
                </a>{" "}
                and “
                <a href="https://policies.google.com/privacy/partners">
                  How Google Uses Information From Sites or Apps That Use Our
                  Services
                </a>
                ”. You will be able to prevent your data from being used by
                Google Analytics by installing Google’s opt-out browser add-on
                from the{" "}
                <a href="https://tools.google.com/dlpage/gaoptout">
                  Google Analytics Opt-out Page
                </a>
                .
              </React.Fragment>,
              `To learn more about how to opt out of the use of cookies and
            similar technologies, generally, visit the Network Advertising
            Initiative and the Digital Advertising Alliance.`,
            ]}
          />
        </Accordion>
        <Accordion
          className={cs.question}
          header={
            <h3>Which Third Party Vendors will get access to my data?</h3>
          }
        >
          <p>
            We rely on service providers to help us provide and improve the
            service, including Chan Zuckerberg Initiative our technology
            partner. In our terms with third party service providers, we work
            with service providers to secure data from unauthorized access and
            use and limit their use of data to providing and improving relevant
            services that we use. If you have more questions about our service
            providers, please contact us at{" "}
            <a href="mailto:privacy@czid.org">privacy@czid.org</a>.
          </p>
        </Accordion>
        <Accordion
          className={cs.question}
          header={
            <h3>
              I’m a California resident - can you tell me more about the CCPA?
            </h3>
          }
        >
          <p>
            The California Consumer Privacy Act (“CCPA”) gives consumers who are
            residents of California the right to request information about the
            personal information that a business has collected in the past 12
            months, such as:
          </p>
          <List
            listItems={[
              <React.Fragment key={nanoid()}>
                <b>Information about Data Collection.</b>
                <div className={cs.innerListItem}>
                  (1) The categories of personal information that have been
                  collected.
                </div>
                <div className={cs.innerListItem}>
                  (2) The specific pieces of personal information that have been
                  collected about you.
                </div>
                <div className={cs.innerListItem}>
                  (3) The categories of sources that have collected it.
                </div>
                <div className={cs.innerListItem}>
                  (4) The business purpose for collecting personal information.
                </div>
              </React.Fragment>,
              <React.Fragment key={nanoid()}>
                <b>Information about Data Disclosure.</b>
                <div className={cs.innerListItem}>
                  (1) The categories of third parties with whom personal
                  information has been shared.
                </div>
                <div className={cs.innerListItem}>
                  (2) The categories of personal information that we have
                  disclosed for a business purpose.
                </div>
              </React.Fragment>,
            ]}
          />
          <p>
            We have described in fuller detail in our{" "}
            <a href="/privacy">Privacy Notice</a> our collection and use of
            personal information in connection with CZ ID, including: (a){" "}
            <b>Information we collect</b> (e.g. uploaded data, user profile
            information, etc.); (b) <b>Sources of information</b> (e.g. data you
            upload to CZ ID and your use of CZ ID), and (c){" "}
            <b>Purposes of disclosure of this information</b> (e.g. with service
            providers to help operate and improve the service as described in
            detail in the CZ ID Privacy Notice). To request any of your
            information described above, email{" "}
            <a href="mailto:privacy@czid.org">privacy@czid.org</a>. Please
            include in your request sufficient information that allows us to
            reasonably verify that you are the person about whom we collected
            personal information.
          </p>
          <p>
            <b>Please note</b>: (1) CZI does not sell your personal data, and
            CZI will not discriminate against you in any way based on your
            exercise of the rights described above, and (2) this{" "}
            <b>notice relates only to the CZ ID services</b> and not other
            services or programs offered, or supported, by CZI. Contact{" "}
            <a href="mailto:privacy@chanzuckerberg.com">
              privacy@chanzuckerberg.com
            </a>{" "}
            if you have questions about the use of personal information in any
            other services or programs offered, or supported, by CZI.
          </p>
        </Accordion>
        <Accordion
          className={cs.question}
          header={
            <h3>
              Where can I learn more information about CZ ID’s commitment to
              security?
            </h3>
          }
        >
          <p>
            The best place to start is CZ ID’s{" "}
            <a href="/privacy">Privacy Policy</a> and{" "}
            <a href="/terms">Terms of Use</a>. More technical readers should
            take a look at the{" "}
            <a href="/security_white_paper">CZ ID Security White Paper</a>. In
            this paper, you can find additional clarity on details regarding our
            infrastructure, application, and physical security, as well as our
            security governance and policies. If you have additional questions,
            please feel free to reach out to our team at{" "}
            <a href="mailto:security@czid.org">security@czid.org</a>.
          </p>
        </Accordion>
      </NarrowContainer>
    );
  }
}
