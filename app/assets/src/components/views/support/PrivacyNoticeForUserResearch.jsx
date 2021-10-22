import React from "react";

import { NarrowContainer } from "~/components/layout";
import List from "~/components/ui/List";

import cs from "./support.scss";

const PrivacyNoticeForUserResearch = () => {
  const renderIntro = () => (
    <>
      <div className={cs.title}>
        <h1>Privacy Notice for User Research</h1>
        <h4 className={cs.subtitle}>Last Updated: September 9, 2021. </h4>
      </div>
      <p>
        This Privacy Notice describes the data that CZI, LLC and CZIF
        (collectively, “Chan Zuckerberg Initiative” or “CZI”) collects from
        individuals participating in research with the Chan Zuckerberg
        Initiative. For more information about IDseq specific privacy practices,
        please see our <a href="/privacy">Privacy Notice</a>.
      </p>
    </>
  );

  const renderAboutSurveys = () => (
    <>
      <h2>User Research Surveys</h2>
      <p>
        The Chan Zuckerberg Initiative (“CZI,” which includes the Chan
        Zuckerberg Initiative Foundation (a 501(c)(3) non-profit and the Chan
        Zuckerberg Initiative, LLC) is conducting a survey to improve the IDseq
        experience.
      </p>
      <p>
        By responding to this survey, you consent to participate in this
        research as well as have your responses be shared in a de-identified
        and/or aggregated manner. The only individuals who will have access to
        identifiable responses are the researchers and designers at CZI working
        on a project or program relating to your survey. Raw data will be stored
        via an encrypted, password-protected server.
      </p>
      <p>
        For more information about how we’ll manage your data, please see the
        User Data section. If you have any general questions about CZI’s data
        use policies for User Research, or to exercise your personal data
        rights, please email{" "}
        <a href="mailto:privacy@chanzuckerberg.com">
          privacy@chanzuckerberg.com
        </a>
        .
      </p>
    </>
  );

  const renderUserDataSection = () => (
    <>
      <h2>User Data</h2>
      <h3>How we collect data</h3>
      <p>
        When you choose to participate in User Research, we collect information
        about you on behalf of CZI Science. We will gather informed consent
        through an opt-in approach from each individual prior to their
        participation in a research study.
      </p>
      <p>Examples of studies include:</p>
      <List
        listItems={[
          "Remote or in person interviews",
          "Group sessions",
          "Diary studies",
          "Surveys",
        ]}
      />
      <p>Examples of the data we could collect include:</p>
      <List
        listItems={[
          "Name",
          "Email",
          "User ID",
          "Role",
          "Institution",
          "Usage on our platform",
          "Screenshots or photos of home-made solutions created to various challenges (e.g., databases, questions guides or cheat sheets)",
          "Details on scientific experiments or tech tools",
        ]}
      />

      <h3>How we use your data</h3>
      <p>
        We use only your user data, outlined above, to answer a question or
        understand an experience, workflow, or problem. This may help us better
        understand user experience and improve our programs and services.
        Outputs from this could include:
      </p>
      <List
        listItems={[
          "Publications",
          "Articles",
          "Videos",
          "Reports",
          "Audio clips",
          "Create aggregated journey maps or systems diagrams",
        ]}
      />
      <p>
        Any outputs from this research will not identify your responses by name,
        data will be presented in a de-identified and aggregated manner.
      </p>
      <p>
        <div className={cs.italics}>
          Note: Any output resulting from this research does not include data
          you uploaded or created in IDseq, such as raw sample data, sample
          metadata, or report data.
        </div>
      </p>

      <h3>How we share your data</h3>
      <p>
        We will link your identity to your response and will retain your
        identifiable information for 3 years. Consequently, de-identified and/or
        anonymized data will be retained for longer. The only individuals who
        will have access to identifiable responses are the researchers and
        designers at CZI working on a project or program relating to your
        research. Raw data will be stored via an encrypted, password-protected
        server.
      </p>
      <p>
        We don’t sell your data. We may share certain data you may voluntarily
        provide to comply with government reporting requirements. We may share
        learnings and findings to contribute to the broader knowledge base on
        this topic, but any reports or presentations resulting from this
        research would be de-identified and anonymized and would not be shared
        in any manner that identifies you by name. Any identifiable information
        collected as part of this study will remain confidential to the extent
        possible and will only be disclosed with your permission or as required
        by law.
      </p>
      <p>
        We may also share your data with the following types of service
        providers, and as a result of the use case, they may be able to access
        this data in providing these services:
        <List
          listItems={[
            "Providers of the tools and services we use to manage our research process. For example, we use Google Forms, Qualtrics, and AppCues to collect survey responses.",
          ]}
        />
      </p>

      <h3>Your legal rights</h3>
      <p>
        Under certain circumstances, you have rights under California and EU
        data protection laws in relation to your personal data, including the
        right to receive a copy of the personal data we hold about you, the
        right to opt-out of participating at any time, the right to request
        deletion, and the right to make corrections. To exercise these rights,
        email{" "}
        <a href="mailto:privacy@chanzuckerberg.com">
          privacy@chanzuckerberg.com
        </a>
        .
      </p>

      <h2>EEA Research Participants</h2>
      <p>
        This privacy notice applies to EEA individuals participating in research
        with the Chan Zuckerberg Initiative.
      </p>
      <p>
        Your personal data is being transferred to, and stored and used outside
        your country and into the US.
      </p>
      <p>
        We have lawful bases to collect, use and personal data we collect about
        you during the Study. The legal basis for the collection of your
        personal data includes consent and/or legitimate interest. Where we rely
        on consent, you have the right to withdraw that consent. Where we rely
        on legitimate interest, you have the right to object.
      </p>
      <p>
        You have choices about our use of your personal data. You have the
        right:
        <div className={cs.nestedList}>
          <List
            ordered={true}
            listItems={[
              "to have your personal data deleted,",
              "to have your personal data corrected or changed,",
              "to object to our use of your personal data or revoke your consent, and",
              "the right to get a copy of the personal data we have about you. You may have the right to contact our Data Protection Officer and/or have additional rights under your applicable laws.",
            ]}
          />
        </div>
      </p>
      <p>
        Contact us at{" "}
        <a href="mailto:privacy@chanzuckerberg.com">
          privacy@chanzuckerberg.com
        </a>{" "}
        to exercise your personal data rights, or to get more information about
        our use of personal data collected in connection with the Study.
      </p>
    </>
  );

  return (
    <NarrowContainer className={cs.privacyPolicy} size="small">
      {renderIntro()}
      {renderAboutSurveys()}
      {renderUserDataSection()}
    </NarrowContainer>
  );
};

export default PrivacyNoticeForUserResearch;
