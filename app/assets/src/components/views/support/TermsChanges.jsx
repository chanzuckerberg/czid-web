import React from "react";

import { NarrowContainer } from "~/components/layout";
import cs from "./support.scss";

export default class TermsChanges extends React.Component {
  render() {
    return (
      <NarrowContainer className={cs.termsOfUse} size="small">
        <div className={cs.title}>
          <h1>IDseq Terms and Privacy Notice Update for June 2019</h1>
        </div>
        <p className={cs.large}>
          Control over your data is important to the success of IDseq. We
          periodically update our Terms of Use and Data Privacy Notice to help
          ensure that our Users understand their responsibilities and rights
          when they use IDseq, as well as how we collect, use and protect their
          data.
        </p>
        {/*TODO: Fill in a specific date*/}
        <p className={cs.large}>
          We are planning to update our Terms of Use and Data Privacy Notice for
          the IDseq service to be effective on June XX, 2019. We encourage our
          Users to read the revised <a href="/terms">Terms</a> and{" "}
          <a href="/privacy">Privacy Notice</a>. We have also provided more
          information about our updates through a new{" "}
          <a href="/faqs">FAQ page</a>.
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
        <ul>
          <li>
            We clarified that the purpose of IDseq is for research purposes only
            and{" "}
            <u>
              is not intended to be used to make decisions regarding health care
              of persons.
            </u>
          </li>
          <li>
            We provided more information about how IDseq works, including how
            and when your data will be shared with other Users of IDseq. As
            before, we seek to filter out human data from the data that is
            uploaded by our Users.
          </li>
          <li>
            We added more clarity by providing new and more nuanced definitions
            of the types of data that IDseq processes. We have retired the broad
            definition of “Research Data” and replaced it with several more
            specific terms, such as “Upload Data” (data you upload), “Sample
            Data,” (part of Upload Data that includes full genetic sequence
            data), “Sample Metadata” (part of Upload Data that provides context
            for the Sample Data) and “Report Data” (the report about the
            pathogen produced by the IDseq service).
          </li>
        </ul>
        <h3>
          <span className={cs.number}>1.</span> Upload and Report Data.
        </h3>
        <ul>
          <li>
            We added more details about how you can have your data removed
            and/or deleted from IDseq.
          </li>
          <li>
            We added more clarity about when “Report Data” becomes visible to
            other Users of IDseq. Report Data and Sample Metadata will be
            available to all other IDseq Users for their use{" "}
            <b>
              after 1 year of it being uploaded unless you take action to remove
              it
            </b>. Making this Report Data available to others is important
            IDseq’s success as a research tool to advance the study of
            infectious diseases.
          </li>
          <li>
            We added that the representations and warranties you make about the
            data you upload, extend not just to us, but also the service
            providers that we use.
          </li>
          <li>
            We emphasized that your obligation to get appropriate permissions to
            upload data to IDseq should include a review of the ethical
            standards that apply to you.
          </li>
          <li>
            We clarified our requirement that Users do not attempt to “identify”
            the person to whom any particular set of data may apply.
          </li>
          <li>
            We made it clearer that we do not want you to upload any regulated
            health information into IDseq.
          </li>
        </ul>
        <h3>
          <span className={cs.number}>2.</span> Authorization To Use IDseq.
        </h3>
        <ul>
          <li>
            We made it clearer that Users should not share their accounts with
            others and that everyone who wishes to access and use IDseq should
            have their own account, including your research associates.
          </li>
        </ul>
        <h3>
          <span className={cs.number}>3.</span> Restrictions On Use.
        </h3>
        <ul>
          <li>
            In the unlikely event we need to terminate your access to IDseq, we
            added that we will try to provide you notice through the contact
            information that you have provided to us.
          </li>
        </ul>
        <h3>
          <span className={cs.number}>4.</span> Registration And Contact
          Information.
        </h3>
        <ul>
          <li>
            We added that we can notify you regarding updates to our Terms of
            Use and Privacy Notice through the contact information that we have
            for you.
          </li>
        </ul>
        <h3>
          <span className={cs.number}>5.</span> Changes to IDseq or the Terms.
        </h3>
        <ul>
          <li>
            We clarified that when we provide notice of changes to our Terms of
            Use, that we will attempt to provide notice <b>before</b> the
            changes are effective.
          </li>
          <li>
            We provided clearer information about how you can close your account
            in the event you do not find our changed terms acceptable, or if you
            choose to no longer use IDseq.
          </li>
        </ul>
        <h3>
          <span className={cs.number}>6.</span> Intellectual Property and
          Security.
        </h3>
        <ul>
          <li>
            We added clearer and simpler language to describe intellectual
            property rights ownership related to IDseq. Neither we nor any other
            Users get any ownership rights or the intellectual property rights
            you own simply because you used IDseq. At the same time, your use of
            IDseq does not give you ownership of any intellectual property
            rights you didn’t already own.
          </li>
          <li>
            If you decide to provide feedback to us about IDseq, we clarified
            that we are free to use it, but are not obligated to use your
            feedback.
          </li>
        </ul>
        <h3>
          <span className={cs.number}>7.</span> Disclaimers and 8. Limitation of
          Liability.
        </h3>
        <ul>
          <li>
            We added that the disclaimers and limitation of liability also
            applies to our service providers.
          </li>
          <li>
            We clarified that local law may give you additional rights and that
            our limitation of liability may not apply to you.
          </li>
        </ul>
        <h3>
          <span className={cs.number}>8.</span> Choice of Law and Arbitration.
        </h3>
        <ul>
          <li>
            We removed the mandatory arbitration requirements. In the unlikely
            event of a dispute between us, it’s still possible for us to
            mutually agree that arbitration is the most effective way to settle
            our dispute, but under the revised terms, you will no longer be
            obligated to <b>only</b> seek remedies in arbitration -- you can now
            have any dispute resolved through court.
          </li>
        </ul>
        <h3>
          <span className={cs.number}>9.</span> Miscellaneous.
        </h3>
        <ul>
          <li>
            We removed language about export compliance because it was
            duplicative of the already existing obligation to comply with law.
          </li>
          <li>
            We added more information about how to contact us through a new FAQ.
          </li>
        </ul>
        <h2>IDseq Data Privacy Notice</h2>
        <p className={cs.large}>
          This summary is intended to help you better understand the most recent
          changes to the IDseq Data Privacy Notice and how they may impact you.
        </p>
        <h3>Introduction Section.</h3>
        <ul>
          <li>
            We clarified that the purpose of IDseq is for research purposes only
            and{" "}
            <u>
              is not intended to be used to make decisions regarding health care
              of persons.
            </u>
          </li>
          <li>
            We provided more information about how IDseq works,{" "}
            <u>
              including how and when data will be shared with other Users of
              IDseq
            </u>. We seek to filter out human data from the data that is
            uploaded by our Users.
          </li>
          <li>
            We added more clarity by providing new and more nuanced definitions
            of the types of data that IDseq processes. We have retired the broad
            definition of “Research Data” and replaced it with several more
            specific terms, such as “Upload Data” (data you upload), “Sample
            Data,” (part of Upload Data that includes full genetic sequence
            data), “Sample Metadata” (part of Upload Data that provides context
            for the Sample Data) and “Report Data” (the report about the
            pathogen produced by the IDseq service).
          </li>
        </ul>
        <h3>
          <span className={cs.number}>1.</span> Upload Data and 2. Report Data.
        </h3>
        <ul>
          <li>
            We added more details about how you can exercise your right to have
            your data removed and/or deleted from IDseq.
          </li>
          <li>
            We added more clarity about your choices with regard to your data,
            including by using the “Project Feature” where you can choose who to
            share your data with.
          </li>
          <li>
            We provided more clarity about when “Sample Metadata” and “Report
            Data” will automatically become visible to other Users of IDseq. All
            Users of IDseq will be able to access and use this data{" "}
            <b>
              after 1 year of it being uploaded unless you take action to remove
              it
            </b>. Making this Report Data available to others is important
            IDseq’s success as a research tool to advance the study of
            infectious diseases.
          </li>
          <li>
            We added that the representations and warranties you make about the
            data you upload, extend not just to us, but also the service
            providers that we use.
          </li>
          <li>
            We added that the representations and warranties you make about the
            data you upload, extend not just to us, but also the service
            providers that we use.
          </li>
          <li>
            We clarified that your obligation to get appropriate permissions to
            upload data to IDseq, should include review of the ethical standards
            that apply to you.
          </li>
          <li>
            We clarified our requirement that Users do not attempt to “identify”
            the person to whom any particular set of data may apply.
          </li>
          <li>
            We made it clearer that we do not want you to upload any regulated
            health information into IDseq.
          </li>
        </ul>
        <h3>
          <span className={cs.number}>3.</span> Visitor and User Data.
        </h3>
        <ul>
          <li>
            We clarified that the term “User Data” means information collected
            from a User.
          </li>
          <li>
            We provided more information about our use of cookies, beacons and
            similar technologies through our new FAQ.
          </li>
          <li>
            We added that we do not use cookies and similar technologies to
            serve ads for third parties.
          </li>
          <li>
            We clarified that we analyze how Visitors use our services, and not
            just Users.
          </li>
          <li>
            We provided additional details about why we believe that we have a
            valid legal basis to use data provided to IDseq and that we have
            legitimate interest in using personal data to enable our operation
            of IDseq.
          </li>
        </ul>
        <h3>
          <span className={cs.number}>4.</span> Vendors and Other Third Parties.
        </h3>
        <ul>
          <li>
            We provided more information about the Chan Zuckerberg Initiative
            which acts as a technology partner in developing and operating IDseq
            and who is a “joint-controller” of personal data for EU legal
            purposes.
          </li>
          <li>
            We provided more information about third party services provided
            access to personal data in connection with the development and
            operation of IDseq, including providing more information in our FAQ.
          </li>
          <li>
            In the unlikely event we stop providing the IDseq service, we added
            that we will let you know <b>before</b> we allow another entity to
            take over its development and operation and that we will require
            that the third party be bound by the Data Privacy Notice and Terms
            of Use.
          </li>
        </ul>
        <h3>
          <span className={cs.number}>6.</span> How Long We Retain Data and Data
          Retention and 7. Choices About Your Data.
        </h3>
        <ul>
          <li>
            We clarified that we retain personal data only as long as reasonably
            necessary.
          </li>
          <li>
            We provided more information about how to delete your data and how
            to exercise your rights about your personal data, including requests
            to access, delete, or restrict our use of their personal data.
          </li>
          <li>
            We added a notice that those in the EU have the right to contact
            their local data protection authority.
          </li>
        </ul>
        <h3>
          <span className={cs.number}>8.</span> Data Transfers.
        </h3>
        <ul>
          <li>
            We provided more information about why transferring data uploaded to
            IDseq to the US is necessary to help researchers to better
            understand infectious diseases.
          </li>
        </ul>
        <h3>
          <span className={cs.number}>9.</span> How to Contact Us.
        </h3>
        <ul>
          <li>We put our contact information into a separate FAQ.</li>
        </ul>
        <h3>
          <span className={cs.number}>10.</span> Changes to the Privacy Notice.
        </h3>
        <ul>
          <li>
            We added that we will provide you notice of any material changes to
            the Privacy Notice <b>before</b> they become effective.
          </li>
        </ul>
      </NarrowContainer>
    );
  }
}
