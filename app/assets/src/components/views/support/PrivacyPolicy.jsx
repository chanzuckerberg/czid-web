import React from "react";
import { NarrowContainer } from "~/components/layout";
import cs from "./support.scss";

export default class PrivacyPolicy extends React.Component {
  render() {
    return (
      <NarrowContainer className={cs.privacyPolicy} size="small">
        <div className={cs.title}>
          <h1>Privacy Policy</h1>
          <h4 className={cs.subtitle}>Last Updated: October 10, 2018</h4>
        </div>
        <p className={cs.large}>
          IDseq is a cloud-based research tool used to make data-driven
          decisions about and to support global public health and the study of
          infectious diseases and pathogens. To do this, IDseq processes genetic
          data in order to identify pathogens contained within. The Chan
          Zuckerberg Biohub Inc. (“CZ Biohub,” “we,” “us,” or “our”) provides
          IDseq (“Services” or IDseq). This Data Privacy Notice describes the
          types of information we collect from website visitors and registered
          users (“Users”), and how we use, share, and protect that information
          IDseq.
        </p>
        <h3>Here&apos;s how IDseq works</h3>
        <p>
          Users upload Research Data. This data contains human and non-human
          genetic sequences, as well as information about those sequences, such
          as the date the sample was collected and the species it was collected
          from. For example, a researcher might upload genetic information from
          mosquitoes, which are often a source of infectious disease or from
          humans, who can be infected by such diseases. IDseq then processes
          this Research Data in order to identify pathogens found within the
          genetic sequence (e.g., the mosquito may be carrying the chikungunya
          virus). IDseq also collects information about visitors and Users in
          order to offer the Service. Other than basic information required to
          create an account (e.g. email address, name), the User determines what
          information they want to upload onto IDseq.
        </p>
        <h2>Research Data</h2>
        <p className={cs.large}>
          Sed posuere consectetur est at lobortis. Cras mattis consectetur purus
          sit amet fermentum. Integer posuere erat a ante venenatis dapibus
          posuere velit aliquet.
        </p>
        <h3>What is Research Data?</h3>
        <p>
          Sed posuere consectetur est at lobortis. Cras mattis consectetur purus
          sit amet fermentum. Integer posuere erat a ante venenatis dapibus
          posuere velit aliquet.
        </p>
        <ul>
          <li>
            <span className={cs.listItemLabel}>Sample Data:</span>
            Sample Data: Sed posuere consectetur est at lobortis. Cras mattis
            consectetur purus sit amet fermentum. Integer posuere erat a ante
            venenatis dapibus posuere velit aliquet.
          </li>
          <li>
            <span className={cs.listItemLabel}>Sample Metadata:</span>
            Sample Data: Sed posuere consectetur est at lobortis. Cras mattis
            consectetur purus sit amet fermentum. Integer posuere erat a ante
            venenatis dapibus posuere velit aliquet.
          </li>
          <li>
            <span className={cs.listItemLabel}>Report Data:</span>
            Sample Data: Sed posuere consectetur est at lobortis. Cras mattis
            consectetur purus sit amet fermentum. Integer posuere erat a ante
            venenatis dapibus posuere velit aliquet.
          </li>
        </ul>
      </NarrowContainer>
    );
  }
}
