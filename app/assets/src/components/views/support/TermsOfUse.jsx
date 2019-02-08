import React from "react";
import { NarrowContainer } from "~/components/layout";
import cs from "./support.scss";

export default class TermsOfUse extends React.Component {
  render() {
    return (
      <NarrowContainer className={cs.termsOfUse} size="small">
        <div className={cs.title}>
          <h1>Terms of Use</h1>
          <h4 className={cs.subtitle}>Last Updated: October 10, 2018</h4>
        </div>
        <p className={cs.large}>
          Please read these Terms of Use (“Terms”) before using the IDseq
          (“Services” or “IDseq”). These Terms are entered into between the Chan
          Zuckerberg Biohub, Inc. (“CZ Biohub”, “we”, “us” or “our”) and you
          (“User”) and govern your use of IDseq, which is comprised of our
          research portal, any associated online services or platforms that link
          to or refer to these Terms, and any databases or data accessible
          through the portal, associated services or platforms. IDseq is
          designed to enable the research community to make data-driven
          decisions regarding global public health and to further the study of
          infectious diseases.
        </p>
        <p className={cs.large}>
          For purposes of these Terms, “Database” refers to both the data and
          database(s) of IDseq; and “Research Data” refers to any data or
          information that you upload through IDseq, other than the information
          you provide during registration to create your account; it includes
          Sample Data, Sample Metadata, and Report Data. “Sample Data” is full
          genetic sequence data uploaded by Users. “Sample Metadata” is
          information related to the Sample Data, such as the host type (e.g.,
          human or mosquito), upload date, location, tissue type, and free-text
          research notes entered by Users. “Report Data” is information IDseq
          produces from the Sample Data and Metadata.
        </p>
        <p className={cs.large}>
          Please carefully read these terms and indicate your acceptance by
          registering for IdSeq. If you do not agree to these Terms, do not use
          IDseq or register for an account. For information about our privacy
          practices, please see the{" "}
          <a href="/privacy">IDseq Data Privacy Policy</a>.
        </p>
        <h3>Summary of Key Things to Know</h3>
        <ul>
          <li>
            <span className={cs.listItemLabel}>
              IDseq does not provide medical advice.
            </span>
            Sed posuere consectetur est at lobortis. Cras mattis consectetur
            purus sit amet fermentum. Integer posuere erat a ante venenatis
            dapibus posuere velit aliquet.
          </li>
          <li>
            <span className={cs.listItemLabel}>
              You must ensure that all personally-identifying information is
              removed from Sample Metadata before it is uploaded to IDseq.
            </span>
            Vestibulum id ligula porta felis euismod semper. Donec ullamcorper
            nulla non metus auctor fringilla. Cum sociis natoque penatibus et
            magnis dis parturient montes, nascetur ridiculus mus. Donec id elit
            non mi porta gravida at eget metus. Donec sed odio dui. Sed posuere
            consectetur est at lobortis. Maecenas faucibus mollis interdum.
          </li>
          <li>
            <span className={cs.listItemLabel}>
              You are responsible for obtaining the permissions necessary to
              collect and upload the Research Data.
            </span>
            Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui.
            Cum sociis natoque penatibus et magnis dis parturient montes,
            nascetur ridiculus mus. Maecenas faucibus mollis interdum. Cum
            sociis natoque penatibus et magnis dis parturient montes, nascetur
            ridiculus mus. Maecenas sed diam eget risus varius blandit sit amet
            non magna.
          </li>
        </ul>
        <h2>
          <span className={cs.number}>1.</span>Research Data
        </h2>
        <p className={cs.large}>
          Sed posuere consectetur est at lobortis. Cras mattis consectetur purus
          sit amet fermentum. Integer posuere erat a ante venenatis dapibus
          posuere velit aliquet.
        </p>
        <ul>
          <li>
            <span className={cs.listItemLabel}>1.1 Sample Data:</span>
            Sed posuere consectetur est at lobortis. Cras mattis consectetur
            purus sit amet fermentum. Integer posuere erat a ante venenatis
            dapibus posuere velit aliquet.
          </li>
          <li>
            <span className={cs.listItemLabel}>1.2 Sample Metadata:</span>
            Sed posuere consectetur est at lobortis. Cras mattis consectetur
            purus sit amet fermen.
          </li>
          <li>
            <span className={cs.listItemLabel}>1.3 Report Data:</span>
            Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui.
            Cum sociis natoque penatibus et magnis dis parturient montes,
            nascetur ridiculus mus. Maecenas faucibus mollis interdum. Cum
            sociis natoque penatibus et magnis dis parturient montes, nascetur
            ridiculus mus. Maecenas sed diam eget risus varius blandit sit amet
            non magna.
          </li>
        </ul>
      </NarrowContainer>
    );
  }
}
