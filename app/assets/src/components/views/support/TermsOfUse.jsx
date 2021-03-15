import React from "react";
import { NarrowContainer } from "~/components/layout";
import Notification from "~ui/notifications/Notification";
import List from "~/components/ui/List";
import { nanoid } from "nanoid";
import cs from "./support.scss";

export default class TermsOfUse extends React.Component {
  render() {
    return (
      <NarrowContainer className={cs.termsOfUse} size="small">
        <div className={cs.title}>
          <h1>IDseq Terms of Use</h1>
          <h4 className={cs.subtitle}>
            Last Updated: May 13, 2019.{" "}
            <a href="/terms_changes">See Recent Changes</a>
          </h4>
          <Notification type="info" displayStyle="flat">
            We invite you to preview our updated Terms of Use, which will go
            into effect on April 1, 2021.{" "}
            <a href="idseq.net/terms_changes">Learn more about these changes</a>
            .
          </Notification>
        </div>
        <p className={cs.large}>
          Please read these Terms of Use (“<b>Terms</b>”) before using IDseq (“
          <b>Services</b>” or “<b>IDseq</b>”). These Terms are entered into
          between the Chan Zuckerberg Biohub, Inc. (“<b>CZ Biohub</b>”, “
          <b>we</b>”, “<b>us</b>” or “<b>our</b>”) and you (“<b>User</b>” or “
          <b>you</b>”) and govern your use of IDseq. IDseq is comprised of our
          research portal, any associated online services or platforms that link
          to or refer to these Terms, and any databases or data accessible
          through the portal, associated services or platforms. IDseq is
          designed to enable the research community to investigate pathogens
          using metagenomic sequencing data and to help further the study of
          infectious diseases.
        </p>
        <p className={cs.large}>
          <b>
            Please carefully read these terms and indicate your acceptance by
            registering for IDseq. If you do not agree to these Terms, do not
            register for an account or use IDseq and do not use it. For more
            information about our privacy practices, please see the “
            <a href="/privacy">Privacy Notice</a>”).
          </b>
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
          <b>Sample Data</b>” as further defined below), as well as information
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
          “<b>Upload Data</b>” is data that Users upload to IDseq (other than
          the information Users provide during registration to create an
          account). Upload Data consists of genetic sequence information (human
          or non-human) and metadata about those genetic sequences (such as time
          and location of sample collection). Upload Data includes Sample Data
          and Sample Metadata.
        </p>
        <p className={cs.large}>
          “<b>Sample Data</b>” is full genetic sequence data uploaded by Users.
          Genetic sequence data contains genetic information about pathogens in
          the sample and of the host from which the sample was taken. The host
          could be a human or non-human (e.g., mosquito). You should not be able
          to find any human sequence data in IDseq other than those embedded in
          samples you yourself have uploaded. This is because we filter out and
          discard host sequence data in order to generate Reports.
        </p>
        <p className={cs.large}>
          “<b>Sample Metadata</b>” includes information related to the Sample
          Data, such as the host type (e.g., human or mosquito), upload date,
          and tissue type and free-text research notes entered by Users. This
          data <u>should not</u> include personally-identifying information
          regarding the individual to whom the Sample Data relates.
        </p>
        <p className={cs.large}>
          “<b>Report Data</b>” is information IDseq produced from Upload Data.
          We generate Report Data by processing Upload Data through our Data
          Pipeline. IDseq’s “<b>Data Pipeline</b>” cleans (e.g., by removing
          duplicate nucleotides) and analyzes (e.g., by matching Sample Data
          nucleotide sequences with known pathogen sequences) the Upload Data.
          Report Data may include, for example, data about the pathogen
          sequences identified in the Sample Data and the frequency of such
          identification (“<b>Pathogen Data</b>”) or raw numeric counts of
          non-personally identifying gene expression profiles that were found in
          the Sample Data (“<b>Gene Counts</b>”).
        </p>
        <p className={cs.large}>
          “<b>Database</b>” refers to both the data and database(s) of IDseq.
        </p>
        <h3>
          Summary of Key Things to Know (see <a href="/faqs">FAQ</a> for more)
        </h3>
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>
                IDseq does not provide medical advice.
              </span>
              The output from IDseq does not constitute and should not be relied
              upon to provide medical advice, diagnosis or treatment.{" "}
              <b>
                It is intended for research, educational, or informational
                purposes only.
              </b>
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>
                You must ensure that all personally-identifying information and
                Protected Health Information is fully removed from Sample
                Metadata before it is uploaded to IDseq.
              </span>
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>
                You are responsible for obtaining the permissions necessary to
                collect and submit the Upload Data.
              </span>
              You represent that you have obtained, and will maintain, all
              consents, permissions, and authorizations needed to collect,
              share, and export Upload Data with IDseq, and for IDseq to use and
              share the information as described in its{" "}
              <a href="/privacy">Privacy Notice</a>.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>
                You may not attempt to re-identify Upload Data.
              </span>
              By using IDseq, you agree that you will not attempt to re-identify
              any Upload Data with a person, and you will not disclose any
              Upload Data of other Users downloaded from the Database except for
              the limited purposes described in these Terms.
            </React.Fragment>,
          ]}
        />
        <h2>
          <span className={cs.number}>1.</span>Upload and Report Data.
        </h2>
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>
                1.1 Use of Your Upload Data.
              </span>
              We need limited rights to your Upload Data <u>solely</u> in order
              to offer IDseq for you and other Users. Specifically, you grant to
              us a worldwide, non-exclusive, royalty-free, transferable (in
              accordance with Section 9.2 below), perpetual and irrevocable
              (except as set forth herein), license (with the right to grant
              further licenses) to use, reproduce, distribute, display, and
              create derivative works (e.g. phylogenetic trees) from Upload Data
              in connection with providing, developing and improving IDseq. You
              may request deletion of your Upload Data from IDseq by emailing{" "}
              <a href="mailto:privacy@idseq.net">privacy@idseq.net</a> and
              including a description of your Upload Data that you wish to have
              removed. We will delete the requested Upload Data within 60 days
              of your request. Please note, that our removal from IDseq will not
              impact any use of Upload Data by others you may have chosen to
              share it with prior to the effective date of removal and we are
              not able to require others Users to stop using Upload Data they
              accessed or downloaded prior to removal. More information about
              Upload Data can be found in our{" "}
              <a href="/privacy">Privacy Notice</a>.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>
                1.2 Use and Visibility of Your Report Data.
              </span>
              You understand that your Report Data is data generated by IDseq,
              does not contain personally-identifying information (i.e. personal
              data) and may be shared with other IDseq Users in order to further
              IDseq’s mission and advance the study of infectious diseases.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>1.3</span>
              You represent and warrant to us and our service partners that (A)
              your provision of the Upload Data to IDseq complies with all
              applicable laws, rules, and regulations, including the Nagoya
              Protocol and relevant export laws (“<b>Applicable Law</b>”) and
              industry guidelines and ethical standards that apply to you (e.g.
              CIOMS or GA4GH) (“<b>Applicable Standards</b>”), and you will
              otherwise comply with all Applicable Law in connection with IDseq;
              (B) you have all consents, permissions, and authorizations
              necessary and sufficient to provide and export the Upload Data to
              us for the purposes described in these Terms and in our{" "}
              <a href="/privacy">Privacy Notice</a> and to grant the rights and
              permissions herein; and (C) the Upload Data -- and our use of the
              Upload Data in accordance with these Terms and our{" "}
              <a href="/privacy">Privacy Notice</a> -- does not and will not
              violate Applicable Law or infringe or violate any third party
              rights.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>1.4</span>
              TO THE EXTENT UPLOAD DATA IS OBTAINED FROM A HUMAN, YOU AGREE NOT
              TO PROVIDE UPLOAD DATA IN A FORM THAT CAN IDENTIFY (DIRECTLY OR
              INDIRECTLY TAKING INTO ACCOUNT ALL THE MEANS REASONABLY LIKELY TO
              BE USED) THE PERSON TO WHOM THE DATA RELATES OR THAT CONSTITUTES
              OR WOULD CONSTITUTE “PROTECTED HEALTH INFORMATION” OR REGULATED
              HEALTH INFORMATION UNDER APPLICABLE LAWS, SUCH AS THE U.S. HEALTH
              INSURANCE PORTABILITY AND ACCOUNTABILITY ACT (“HIPAA”). For
              example, the Upload Data shall not include any personal
              identifiers, including without limitation name, address, dates,
              telephone numbers, e-mail addresses, or medical health records.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>1.5</span>
              To the extent that any Upload Data is obtained from a human data
              subject, you also specifically represent and warrant to us and our
              service partners that (A) you have provided any required notice
              to, and obtained any necessary informed consent of, any such
              person for the collection, use, and provision to IDseq of the
              Research Data; and (B) your provision of the Upload Data to IDseq
              is covered under all such notices and consents, as well as
              Applicable Standards and Applicable Law. Please note that we
              filter out and discard human sequence data as part of generating
              Report Data because we don’t need this data for IDseq. See{" "}
              <a href="/faqs">here</a> for more details.
            </React.Fragment>,
          ]}
        />
        <h2>
          <span className={cs.number}>2.</span>Authorization To Use IDseq.
        </h2>
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>2.1</span>
              Subject to and conditioned on your compliance with these Terms, we
              grant you permission to access and use IDseq in accordance with
              Applicable Law, solely for your own internal academic or internal
              scientific research purposes. You may not permit any third party
              to access or use or “share” your Account or IDseq. All persons
              wishing to access the Service must create their own separate
              account and agree to these Terms.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>2.2</span>
              IDseq may not be used to provide medical or other services to any
              third party (for instance, to inform or provide disease
              diagnoses). IDseq is not intended to diagnose, treat, cure, or
              prevent any disease and is not a substitute for medical advice.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>2.3</span>
              You shall not disclose or distribute the Database, in whole or in
              part, or any works derived from the Database to any third party
              for any purpose, except for the following:
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              You may disclose the documents that you download from the Database
              using IDseq’s intended functionality to your employees and agents
              who are registered Users of the Service and who are engaged in
              conducting your research (“<b>Research Associates</b>”) for the
              sole purpose of carrying out your internal research. Your Research
              Associates must also agree to use IDseq and Database in accordance
              with these Terms.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              You may share research findings derived from use of IDseq to
              others, including with the public, so long as these findings
              include no personally-identifying information and you comply with
              Applicable Law and these Terms (“<b>Research Findings</b>”).
            </React.Fragment>,
            `You may disclose the Database to the minimum extent necessary to
            comply with Applicable Law or court order, so long as you promptly
            notify us prior to making such disclosure (to the extent Applicable
            Law and court order permit you to so notify us).`,
          ]}
        />
        <h2>
          <span className={cs.number}>3.</span>Limitations On Use.
        </h2>
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>3.1</span>
              You shall not re-identify or attempt to re-identify any Database
              records or content for any purpose other than responding to a
              request from the individual whom the record within your Upload
              Data is about, including without limitation to make employment
              decisions or to make eligibility, coverage, underwriting,
              premium-setting or other decisions with respect to insurance.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>3.2</span>
              You shall not otherwise access or use, or attempt to access or
              use, IDseq to take any action that could harm us, IDseq or its
              Users, or any third party, or use IDseq in any manner that
              violates Applicable Law or infringes or otherwise violates third
              party rights.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>3.3</span>
              You represent and warrant that you are a natural person of legal
              age who is competent and able to enter into and carry out these
              Terms, and, if you are using IDseq on behalf of any entity, that
              you are authorized to enter into these Terms on such entity’s
              behalf and that such entity agrees to be responsible to us if you
              or that entity violates these Terms.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>3.4</span>
              We may restrict or terminate your access to IDseq at any time,
              including for breach of these Terms. In such case we will attempt
              to provide you notice through the contact information we have for
              you.
            </React.Fragment>,
          ]}
        />
        <h2>
          <span className={cs.number}>4.</span>Registration And Contact
          Information.
        </h2>
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>4.1</span>
              To access IDseq you will need to be a registered “User.” At
              registration, you will be asked to provide certain information (“
              <b>Account Information</b>”) to create an individual user account
              (an “<b>Account</b>”). You agree that you will not create more
              than one Account, or create an Account for anyone other than
              yourself. You may not share your Account credentials.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>4.2</span>
              You agree to keep your Account Information accurate and
              up-to-date. You agree that we may send to the e-mail address you
              provide us or otherwise electronically deliver notices or
              communications regarding IDseq, including notices of updates to
              these terms and the <a href="/privacy">Privacy Notice</a>.
            </React.Fragment>,
          ]}
        />
        <h2>
          <span className={cs.number}>5.</span>Changes To IDseq Or These Terms.
        </h2>
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>5.1 Changes to IDseq.</span>
              We may, from time to time, withdraw, suspend, change or update
              IDseq (including the Database) or its features without notice,
              subject to Applicable Law. Neither we, nor our service providers,
              will be liable if all or any part of IDseq is unavailable or
              changes at any time.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>
                5.2 Changes to these Terms.
              </span>
              We may update these Terms from time to time and will notify you of
              material changes to the Terms, prior to their becoming effective.
              If you do not agree to the updated Terms, your remedy will be to
              close your Account prior to the effective date of those changes.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>
                5.3 Closing Your Account.
              </span>
              You can close your Account at any time. Just contact us at{" "}
              <a href="mailto:privacy@idseq.net">privacy@idseq.net</a>.
            </React.Fragment>,
          ]}
        />
        <h2>
          <span className={cs.number}>6.</span>Intellectual Property And
          Security.
        </h2>
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>
                6.1 Intellectual Property Rights.
              </span>
              Just because you upload data to IDseq, you are not giving us any
              ownership of your intellectual property rights (see Section 1.1
              above). Subject to these Terms, we grant you a limited right to
              access IDseq, and we reserve all other of our intellectual
              property rights in IDseq. Using IDseq does not give you any
              ownership in our IDseq, our services or the content or information
              made available through IDseq that is not already yours. Trademarks
              and logos used in connection with IDseq are the trademarks of
              their respective owners. Our logos and other trademarks, service
              marks, graphics, and logos used for our services are trademarks or
              registered trademarks of ours and these Terms do not grant you any
              rights to use them.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>6.2 Feedback.</span>
              We’d love your feedback about how to improve IDseq at{" "}
              <a href="mailto:help@idseq.net">help@idseq.net</a>. That said, by
              giving us feedback, you agree that we can use and share it for any
              purpose without compensation to you. You agree that we are not
              required to use your feedback.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>6.3 Security.</span>
              You will establish, implement, and maintain appropriate physical,
              technical and organizational measures that are designed to: (a)
              protect the security and integrity of any network or system used
              to access IDseq, including any Database records; and (b) guard
              against the accidental or unauthorized access, use, alteration or
              disclosure of IDseq through your Account. Please notify us
              immediately at{" "}
              <a href="mailto:security@idseq.net">security@idseq.net</a> if you
              suspect your Account has been compromised or are aware of any
              other security issues relating to IDseq.
            </React.Fragment>,
          ]}
        />
        <h2>
          <span className={cs.number}>7.</span>Disclaimers.
        </h2>
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>7.1</span>
              In order to further infectious disease research, we rely upon
              Users to upload data to the Database. We and our service providers
              do not review or correct any data uploaded into IDseq. If you
              would like to report any issue with IDseq or the Database please
              contact us at <a href="mailto:help@idseq.net">help@idseq.net</a>.
              IDseq is not intended as a storage service, so please back up your
              Upload Data using a secure service of your choice.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>7.2</span>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>7.2.1</span>
              YOUR ACCESS AND USE IDSEQ AT YOUR SOLE RISK AND AGREE THAT WE AND
              OUR SERVICE PROVIDERS WILL NOT BE RESPONSIBLE FOR ANY ACTIONS YOU
              TAKE BASED ON IDSEQ OR FOR ANY INACCURATE DATA OR OUTPUTS OF IDSEQ
              (INCLUDING MISIDENTIFICATION OF -- OR THE FAILURE TO IDENTIFY --
              DISEASE SEQUENCES).
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>7.2.2</span>
              IDSEQ IS PROVIDED “AS IS” WITH ALL FAULTS, AND WE AND OUR SERVICE
              PROVIDERS HEREBY DISCLAIM ALL REPRESENTATIONS AND WARRANTIES,
              EXPRESS, STATUTORY, OR IMPLIED (INCLUDING, WITHOUT LIMITATION,
              IMPLIED WARRANTIES OF TITLE, NON-INFRINGEMENT, MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, AND ALL WARRANTIES ARISING FROM
              THE COURSE OF DEALING, USAGE, OR TRADE PRACTICE) WITH RESPECT TO
              IDSEQ. IDSEQ IS NOT INTENDED TO BE USED AND SHOULD NOT BE USED AS
              A MEDICAL DEVICE OR FOR PURPOSES OF MEDICAL DIAGNOSIS OR
              TREATMENT.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>7.2.3</span>
              FOR CLARITY AND WITHOUT LIMITING THE FOREGOING, WE AND OUR SERVICE
              PROVIDERS DO NOT MAKE ANY GUARANTEES (I) REGARDING THE ACCURACY,
              COMPLETENESS, TIMELINESS, SECURITY, AVAILABILITY OR INTEGRITY OF
              IDSEQ, (II) THAT IDSEQ WILL BE UNINTERRUPTED OR OPERATE IN
              COMBINATION WITH ANY SOFTWARE, SERVICE, SYSTEM OR OTHER DATA, OR
              (III) THAT IDSEQ WILL MEET ANY REQUIREMENTS OF ANY PERSON OR
              ENTITY, OR ANY REGULATORY APPROVALS OR REQUIREMENTS. WITHOUT
              LIMITATION, YOU ACKNOWLEDGE THAT IDSEQ IS NOT A BUSINESS ASSOCIATE
              FOR PURPOSES OF HIPAA.
            </React.Fragment>,
          ]}
        />
        <h2>
          <span className={cs.number}>8.</span>Indemnification, Limitation Of
          Liability, And Choice Of Law.
        </h2>
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>8.1</span>
              To the maximum extent permitted by Applicable Law, you agree to
              indemnify and hold harmless CZ Biohub, its affiliates (including
              the Chan Zuckerberg Initiative, LLC (<b>CZI</b>), and their
              successors, assigns, officers, directors, employees, and agents
              (collectively, the “<b>CZ Biohub Protected Parties</b>”) from and
              against any and all liabilities, costs, damages, charges, losses,
              penalties, judgments, settlements, and expenses (including
              reasonable attorney’s fees) (“<b>Losses</b>”) arising out of or
              related to any suit, demand, action, proceeding, or other claim by
              a third party (“<b>Claims</b>”) arising out of or relating to: (a)
              your actual or alleged failure to comply with Applicable Law or
              these Terms, (b) your Research Data, or (c) your actual or alleged
              violation of any third party rights.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>
                8.2 LIMITATION OF LIABILITY.
              </span>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE CZ BIOHUB
              PROTECTED PARTIES WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES OF ANY KIND (INCLUDING
              LOST PROFITS, LOST DATA, BUSINESS INTERRUPTION, OR LOSS OF
              GOODWILL) IRRESPECTIVE OF WHETHER SUCH DAMAGES ARISE FROM CLAIMS
              BROUGHT IN CONTRACT, TORT, NEGLIGENCE, WARRANTY, STRICT LIABILITY,
              OR ANY OTHER THEORY AT LAW OR IN EQUITY, AND EVEN IF ANY CZ BIOHUB
              PROTECTED PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH
              DAMAGES. WITHOUT LIMITING THE FOREGOING, TO THE MAXIMUM EXTENT
              PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL THE CZ BIOHUB
              PROTECTED PARTIES’ AGGREGATE LIABILITY ARISING OUT OF OR RELATING
              TO THESE TERMS OR IDSEQ EXCEED USD $100. THE EXCLUSIONS AND
              LIMITATIONS SET FORTH IN THIS SECTION 9 DO NOT APPLY TO LOSSES
              ARISING FROM A CZ BIOHUB PROTECTED PARTY’S GROSS NEGLIGENCE OR
              WILLFUL MISCONDUCT. IF ANY LIMITATION IN THIS SECTION 9 IS
              UNENFORCEABLE IN ANY INSTANCE, THEN SUCH LIMITATION WILL APPLY TO
              THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW.
            </React.Fragment>,
            `SOME LAWS DO NOT ALLOW THE LIMITATION OR EXCLUSION OF LIABILITY, SO
          THESE LIMITS MAY NOT APPLY TO YOU.`,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>
                Choice of Law / Jurisdiction / Venue.
              </span>
              These Terms, and all matters arising out of or relating to these
              Terms, whether sounding in contract, tort, or statute, will be
              governed by, and construed in accordance with, the laws of the
              State of California, without regard to conflict of law provisions.
              Any lawsuits, arbitration hearings, or other proceedings involving
              a dispute or claim between you and us that arises in whole or in
              part from IDseq, shall be venued exclusively in San Francisco,
              California and You hereby consent to the exclusive jurisdiction of
              the courts located in San Francisco, California for the resolution
              of any dispute.
            </React.Fragment>,
          ]}
        />
        <h2>
          <span className={cs.number}>9.</span>Miscellaneous.
        </h2>
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>9.1 Severability.</span>
              In the event any part of these Terms is deemed unenforceable, the
              remaining portion will remain in effect and you and we expressly
              authorize a court of competent jurisdiction to make the
              modifications that are necessary to comply with existing law, in a
              manner most closely representing the original intent of you and us
              as expressed in these Terms.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>9.2 Assignment.</span>
              You may not assign or delegate your rights or obligations under
              these Terms, in whole or in part, without our prior written
              approval (not to be unreasonably withheld); any assignment or
              delegation in violation of this provision will be null and void.
              We may assign our rights or delegate our obligations under these
              Terms. In the event of an assignment by us, we will provide you
              notice through the Service or contact information you have
              provided to us and these Terms shall otherwise remain in full
              force and effect and shall bind the permitted assignee.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>9.3 Amendment.</span>
              No waiver of any of the provisions of the Terms will constitute a
              waiver of any other provision (whether or not similar). No waiver
              will be binding unless executed in writing by the party to be
              bound by the waiver.
            </React.Fragment>,
            <React.Fragment key={nanoid()}>
              <span className={cs.listItemLabel}>9.4 Entire Agreement.</span>
              These Terms (along with the <a href="/privacy">Privacy Notice</a>)
              constitute the entire agreement between you and us regarding
              IDseq. If you wish to modify these Terms, any amendment must be
              provided to us in writing and signed by our authorized
              representative.
            </React.Fragment>,
          ]}
        />
        <h2>
          <span className={cs.number}>10.</span> Contact Information.
        </h2>
        <List
          listItems={[
            <React.Fragment key={nanoid()}>
              If you have any questions, comments, or concerns with Terms, you
              may contact us at{" "}
              <a href="mailto:help@idseq.net">help@idseq.net</a> or by physical
              mail at the addresses in the <a href="/faqs">FAQ</a>.
            </React.Fragment>,
          ]}
        />
      </NarrowContainer>
    );
  }
}
