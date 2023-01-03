import cx from "classnames";
import { nanoid } from "nanoid";
import React from "react";

import { NarrowContainer } from "~/components/layout";
import List from "~/components/ui/List";
import cs from "./support.scss";

const TermsChanges = () => {
  const termsUpdateForJune2019 = () => (
    <>
      <div className={cs.title}>
        <h1>IDseq Terms and Privacy Notice Update for June 2019</h1>
      </div>
      <p className={cs.large}>
        Control over your data is important to the success of IDseq. We
        periodically update our Terms of Use and Data Privacy Notice to help
        ensure that our Users understand their responsibilities and rights when
        they use IDseq, as well as how we collect, use and protect their data.
      </p>
      {/* TODO: Fill in a specific date */}
      <p className={cs.large}>
        We are planning to update our Terms of Use and Data Privacy Notice for
        the IDseq service to be effective on June 24, 2019. We encourage our
        Users to read the revised <a href="/terms">Terms</a> and{" "}
        <a href="/privacy">Privacy Notice</a>. We have also provided more
        information about our updates through a new <a href="/faqs">FAQ page</a>
        .
      </p>
      <h2>IDseq Terms of Use</h2>
      <p className={cs.large}>
        This summary is intended to help you better understand the most recent
        changes to the IDseq Terms of Use and how they may impact you. To be
        clear, many important matters are not changing, including your
        responsibility to get appropriate permissions to upload and share data
        through IDseq and our promise not to sell your data.{" "}
        <b>You own your data - using IDseq doesn’t change that.</b>
      </p>
      <p className={cs.large}>
        We also encourage you to read the full revised{" "}
        <a href="/terms">Terms</a>.
      </p>
      <h3>Introduction Section.</h3>
      <List
        listItems={[
          <React.Fragment key={nanoid()}>
            We clarified that the purpose of IDseq is for research purposes only
            and{" "}
            <u>
              is not intended to be used to make decisions regarding health care
              of persons.
            </u>
          </React.Fragment>,
          `We provided more information about how IDseq works, including how
        and when your data will be shared with other Users of IDseq. As
        before, we seek to filter out human data from the data that is
        uploaded by our Users.`,
          `We added more clarity by providing new and more nuanced definitions
        of the types of data that IDseq processes. We have retired the broad
        definition of “Research Data” and replaced it with several more
        specific terms, such as “Upload Data” (data you upload), “Sample
        Data,” (part of Upload Data that includes full genetic sequence
        data), “Sample Metadata” (part of Upload Data that provides context
        for the Sample Data) and “Report Data” (the report about the
        pathogen produced by the IDseq service).`,
        ]}
      />
      <h3>
        <span className={cs.number}>1.</span> Upload and Report Data.
      </h3>
      <List
        listItems={[
          `We added more details about how you can have your data removed
        and/or deleted from IDseq.`,
          <React.Fragment key={nanoid()}>
            We added more clarity about when “Report Data” becomes visible to
            other Users of IDseq. Report Data and Sample Metadata will be
            available to all other IDseq Users for their use{" "}
            <b>
              after 1 year of it being uploaded unless you take action to remove
              it
            </b>
            . Making this Report Data available to others is important
            IDseq&apos;s success as a research tool to advance the study of
            infectious diseases.
          </React.Fragment>,
          `We added that the representations and warranties you make about the
        data you upload, extend not just to us, but also the service
        providers that we use.`,
          `We emphasized that your obligation to get appropriate permissions to
        upload data to IDseq should include a review of the ethical
        standards that apply to you.`,
          `We clarified our requirement that Users do not attempt to “identify”
        the person to whom any particular set of data may apply.`,
          `We made it clearer that we do not want you to upload any regulated
        health information into IDseq.`,
        ]}
      />
      <h3>
        <span className={cs.number}>2.</span> Authorization To Use IDseq.
      </h3>
      <List
        listItems={[
          `We made it clearer that Users should not share their accounts with
        others and that everyone who wishes to access and use IDseq should
        have their own account, including your research associates.`,
        ]}
      />
      <h3>
        <span className={cs.number}>3.</span> Restrictions On Use.
      </h3>
      <List
        listItems={[
          `In the unlikely event we need to terminate your access to IDseq, we
        added that we will try to provide you notice through the contact
        information that you have provided to us.`,
        ]}
      />
      <h3>
        <span className={cs.number}>4.</span> Registration And Contact
        Information.
      </h3>
      <List
        listItems={[
          `We added that we can notify you regarding updates to our Terms of
        Use and Privacy Notice through the contact information that we have
        for you.`,
        ]}
      />
      <h3>
        <span className={cs.number}>5.</span> Changes to IDseq or the Terms.
      </h3>
      <List
        listItems={[
          <React.Fragment key={nanoid()}>
            We clarified that when we provide notice of changes to our Terms of
            Use, that we will attempt to provide notice <b>before</b> the
            changes are effective.
          </React.Fragment>,
          `We provided clearer information about how you can close your account
        in the event you do not find our changed terms acceptable, or if you
        choose to no longer use IDseq.`,
        ]}
      />
      <h3>
        <span className={cs.number}>6.</span> Intellectual Property and
        Security.
      </h3>
      <List
        listItems={[
          `We added clearer and simpler language to describe intellectual
        property rights ownership related to IDseq. Neither we nor any other
        Users get any ownership rights or the intellectual property rights
        you own simply because you used IDseq. At the same time, your use of
        IDseq does not give you ownership of any intellectual property
        rights you didn’t already own.`,
          `If you decide to provide feedback to us about IDseq, we clarified
        that we are free to use it, but are not obligated to use your
        feedback.`,
        ]}
      />
      <h3>
        <span className={cs.number}>7.</span> Disclaimers and 8. Limitation of
        Liability.
      </h3>
      <List
        listItems={[
          `We added that the disclaimers and limitation of liability also
        applies to our service providers.`,
          `We clarified that local law may give you additional rights and that
        our limitation of liability may not apply to you.`,
        ]}
      />
      <h3>
        <span className={cs.number}>8.</span> Choice of Law and Arbitration.
      </h3>
      <List
        listItems={[
          <React.Fragment key={nanoid()}>
            We removed the mandatory arbitration requirements. In the unlikely
            event of a dispute between us, it’s still possible for us to
            mutually agree that arbitration is the most effective way to settle
            our dispute, but under the revised terms, you will no longer be
            obligated to <b>only</b> seek remedies in arbitration -- you can now
            have any dispute resolved through court.
          </React.Fragment>,
        ]}
      />
      <h3>
        <span className={cs.number}>9.</span> Miscellaneous.
      </h3>
      <List
        listItems={[
          `We removed language about export compliance because it was
        duplicative of the already existing obligation to comply with law.`,
          `We added more information about how to contact us through a new FAQ.`,
        ]}
      />
      <h2>IDseq Data Privacy Notice</h2>
      <p className={cs.large}>
        This summary is intended to help you better understand the most recent
        changes to the <a href="/privacy">IDseq Data Privacy Notice</a> and how
        they may impact you.
      </p>
      <h3>Introduction Section.</h3>
      <List
        listItems={[
          <React.Fragment key={nanoid()}>
            We clarified that the purpose of IDseq is for research purposes only
            and{" "}
            <u>
              is not intended to be used to make decisions regarding health care
              of persons.
            </u>
          </React.Fragment>,
          <React.Fragment key={nanoid()}>
            We provided more information about how IDseq works,{" "}
            <u>
              including how and when data will be shared with other Users of
              IDseq
            </u>
            . We seek to filter out human data from the data that is uploaded by
            our Users.
          </React.Fragment>,
          `We added more clarity by providing new and more nuanced definitions
        of the types of data that IDseq processes. We have retired the broad
        definition of “Research Data” and replaced it with several more
        specific terms, such as “Upload Data” (data you upload), “Sample
        Data,” (part of Upload Data that includes full genetic sequence
        data), “Sample Metadata” (part of Upload Data that provides context
        for the Sample Data) and “Report Data” (the report about the
        pathogen produced by the IDseq service).`,
        ]}
      />
      <h3>
        <span className={cs.number}>1.</span> Upload Data and 2. Report Data.
      </h3>
      <List
        listItems={[
          `We added more details about how you can exercise your right to have
        your data removed and/or deleted from IDseq.`,
          `We added more clarity about your choices with regard to your data,
        including by using the “Project Feature” where you can choose who to
        share your data with.`,
          <React.Fragment key={nanoid()}>
            We provided more clarity about when “Sample Metadata” and “Report
            Data” will automatically become visible to other Users of IDseq. All
            Users of IDseq will be able to access and use this data{" "}
            <b>
              after 1 year of it being uploaded unless you take action to remove
              it
            </b>
            . Making this Report Data available to others is important
            IDseq&apos;s success as a research tool to advance the study of
            infectious diseases.
          </React.Fragment>,
          `We added that the representations and warranties you make about the
        data you upload, extend not just to us, but also the service
        providers that we use.`,
          `We added that the representations and warranties you make about the
        data you upload, extend not just to us, but also the service
        providers that we use.`,
          `We clarified that your obligation to get appropriate permissions to
        upload data to IDseq, should include review of the ethical standards
        that apply to you.`,
          `We clarified our requirement that Users do not attempt to “identify”
        the person to whom any particular set of data may apply.`,
          `We made it clearer that we do not want you to upload any regulated
        health information into IDseq.`,
        ]}
      />
      <h3>
        <span className={cs.number}>3.</span> Visitor and User Data.
      </h3>
      <List
        listItems={[
          `We clarified that the term “User Data” means information collected
        from a User.`,
          `We provided more information about our use of cookies, beacons and
        similar technologies through our new FAQ.`,
          `We added that we do not use cookies and similar technologies to
        serve ads for third parties.`,
          `We clarified that we analyze how Visitors use our services, and not
        just Users.`,
          `We provided additional details about why we believe that we have a
        valid legal basis to use data provided to IDseq and that we have
        legitimate interest in using personal data to enable our operation
        of IDseq.`,
        ]}
      />
      <h3>
        <span className={cs.number}>4.</span> Vendors and Other Third Parties.
      </h3>
      <List
        listItems={[
          `We provided more information about the Chan Zuckerberg Initiative
        which acts as a technology partner in developing and operating IDseq
        and who is a “joint-controller” of personal data for EU legal
        purposes.`,
          `We provided more information about third party services provided
        access to personal data in connection with the development and
        operation of IDseq, including providing more information in our FAQ.`,
          <React.Fragment key={nanoid()}>
            In the unlikely event we stop providing the IDseq service, we added
            that we will let you know <b>before</b> we allow another entity to
            take over its development and operation and that we will require
            that the third party be bound by the Data Privacy Notice and Terms
            of Use.
          </React.Fragment>,
        ]}
      />
      <h3>
        <span className={cs.number}>6.</span> How Long We Retain Data and Data
        Retention and 7. Choices About Your Data.
      </h3>
      <List
        listItems={[
          `We clarified that we retain personal data only as long as reasonably
        necessary.`,
          `We provided more information about how to delete your data and how
        to exercise your rights about your personal data, including requests
        to access, delete, or restrict our use of their personal data.`,
          `We added a notice that those in the EU have the right to contact
        their local data protection authority.`,
        ]}
      />
      <h3>
        <span className={cs.number}>8.</span> Data Transfers.
      </h3>
      <List
        listItems={[
          `We provided more information about why transferring data uploaded to
          IDseq to the US is necessary to help researchers to better
          understand infectious diseases.`,
        ]}
      />
      <h3>
        <span className={cs.number}>9.</span> How to Contact Us.
      </h3>
      <List
        listItems={[`We put our contact information into a separate FAQ.`]}
      />
      <h3>
        <span className={cs.number}>10.</span> Changes to the Privacy Notice.
      </h3>
      <List
        listItems={[
          <React.Fragment key={nanoid()}>
            We added that we will provide you notice of any material changes to
            the Privacy Notice <b>before</b> they become effective.
          </React.Fragment>,
        ]}
      />
    </>
  );

  const termsUpdateForApril2021 = () => (
    <>
      <div className={cs.title}>
        <h1>IDseq Terms and Privacy Notice Update for April 2021</h1>
      </div>
      <p className={cs.large}>
        We periodically update our <a href="/terms">Terms of Use</a> and{" "}
        <a href="/privacy">Privacy Policy</a> to help ensure that we are
        providing useful transparency regarding how we collect, use and protect
        their data and so our Users understand their responsibilities and rights
        when they use IDseq.
      </p>
      <p className={cs.large}>
        We are planning to update our Terms of Use and Privacy Policy for the
        IDseq service to be effective on April 1, 2021, and have also summarized
        key updates below:
      </p>
      <h2>IDseq Terms of Use</h2>
      <List
        listItems={[
          <React.Fragment key={nanoid()}>
            <i>
              Disputes between IDseq and you will now be resolved through final
              and binding arbitration.
            </i>{" "}
            This is a more efficient and cost effective (we will bear most
            costs) way of resolving disputes related to IDseq. Our Terms of Use
            describes in detail how this works, and how you can opt out.
          </React.Fragment>,
          `To help make the document easier to understand, we’ve provided a summary
           at the top of our Terms of Use of key things to know.`,
        ]}
      />
      <h2>IDseq Privacy Policy</h2>
      <List
        listItems={[
          `To help make the document easier to understand, we’ve created a Summary Table at
          the top of our Privacy Policy that explains the key aspects of our data practices in a concise way.`,
          <React.Fragment key={nanoid()}>
            <i>Chan Zuckerberg Initiative Foundation.</i> IDseq, as of April 1,
            2021, will be provided by the Chan Zuckerberg Biohub in close
            collaboration with the Chan Zuckerberg Initiative Foundation. This
            is part of the Chan Zuckerberg Initiative’s shifting of its Science
            employees, projects, and activities to live within the existing CZI
            Foundation, a 501(c)(3) nonprofit entity. We want to assure you that
            this does not change our commitment to delivering a high-quality
            experience for you within IDseq. This is a largely back-end
            organizational change that will take effect on April 1, 2021, and
            will have minimal impacts on CZI’s work with grantees and partners,
            or on the CZI Science team day-to-day.
          </React.Fragment>,
          <React.Fragment key={nanoid()}>
            <i>Nextclade.</i> Users now can choose to share certain Report Data
            with third party tools, like Nextclade. This integration is purely
            optional and you choose to use it or not. As a reminder, we will
            never share raw sample data you’ve uploaded -- only you can access
            that data.
          </React.Fragment>,
        ]}
      />
      <p className={cx(cs.large, cs.last)}>
        For questions about these changes, please contact us at{" "}
        <a href="mailto:privacy@czid.org">privacy@czid.org</a>.
      </p>
    </>
  );

  const termsUpdateForDecember2021 = () => (
    <>
      <div className={cs.title}>
        <h1>IDseq Terms and Privacy Notice Update for December 2021</h1>
      </div>
      <p className={cx(cs.large, cs.last)}>
        Effective December 7, 2021, we are changing our product name to Chan
        Zuckerberg ID. As a result, we have updated our{" "}
        <a href="/terms">Terms of Use</a> and{" "}
        <a href="/privacy">Privacy Policy</a> to reflect this name change. No
        additional changes were made to our terms in this update.
      </p>
    </>
  );

  const termsUpdateForJanuary2023 = () => (
    <>
      <div className={cs.title}>
        <h1>CZ ID Terms and Privacy Notice Update for January 2023</h1>
      </div>
      <p className={cx(cs.large, cs.last)}>
        Effective January 1, 2023, we have updated our{" "}
        <a href="/terms">Terms of Use</a> and{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>
      <p className={cs.large}>
        We periodically update our <a href="/terms">Terms of Use</a> and{" "}
        <a href="/privacy">Privacy Policy</a> to help ensure that we are
        providing useful information regarding how we collect, use, and protect
        personal data and so our Users can understand their responsibilities and
        rights when they use CZ ID. We have summarized key updates below:
      </p>
      <h2>CZ ID Terms of Use</h2>
      <List
        listItems={[
          <React.Fragment key={nanoid()}>
            We updated our timelines for addressing Users’ data privacy requests
            and our Contact Information.
          </React.Fragment>,
        ]}
      />
      <h2>CZ ID Privacy Policy</h2>
      <List
        listItems={[
          <>
            To give you more control over your data, we have removed the
            automatic sharing of your Report Data and Sample Metadata after the
            1-year anniversary of the Raw Sample Data being uploaded to CZ ID.
            Users will still have the option to share their Report Data and
            Sample Metadata with other Users at their discretion.
          </>,
          <>
            We clarified our legal basis (consent) for collecting data through
            the use of cookies when GDPR applies.{" "}
          </>,
          <>We added a section about Do Not Track signals.</>,
          <>
            We clarified that we use IP addresses to infer the approximate
            location (i.e., country) of our Users so that we can comply with
            applicable laws and to better understand the geographic distribution
            of our Users.{" "}
          </>,
          <>
            We updated the timelines for addressing a User’s data privacy
            requests.
          </>,
          <>
            We added additional information for California residents. We also
            added additional information for Virginia, Colorado, Connecticut,
            and Utah to keep up with changes in privacy law.{" "}
          </>,
        ]}
      />
      <p className={cx(cs.large, cs.last)}>
        For questions about these changes, please contact us at{" "}
        <a href="mailto:privacy@czid.org">privacy@czid.org</a>.
      </p>
    </>
  );

  return (
    <NarrowContainer className={cs.termsOfUse} size="small">
      {termsUpdateForJanuary2023()}
      {termsUpdateForDecember2021()}
      {termsUpdateForApril2021()}
      {termsUpdateForJune2019()}
    </NarrowContainer>
  );
};

export default TermsChanges;
