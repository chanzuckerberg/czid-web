import React from "react";
import { Accordion, NarrowContainer } from "~/components/layout";
import cs from "./support.scss";

export default class FAQPage extends React.Component {
  render() {
    return (
      <NarrowContainer className={cs.faqPage} size="small">
        <div className={cs.title}>
          <h1>Frequently Asked Questions</h1>
        </div>
        <p className={cs.large}>
          Vestibulum id ligula porta felis euismod semper. Nullam quis risus
          eget urna mollis ornare vel eu leo. Donec ullamcorper nulla non metus
          auctor fringilla. Aenean eu leo quam. Pellentesque ornare sem lacinia
          quam venenatis vestibulum. Donec sed odio dui. Etiam porta sem
          malesuada magna mollis euismod. Vestibulum id ligula porta felis
          euismod semper.
        </p>
        <h2>Using IDseq</h2>
        <Accordion
          className={cs.question}
          header={<h3>How much does IDseq cost?</h3>}
        >
          <p>
            Sed posuere consectetur est at lobortis. Cras mattis consectetur
            purus sit amet fermentum. Integer posuere erat a ante venenatis
            dapibus posuere velit aliquet.
          </p>
        </Accordion>
        <Accordion
          className={cs.question}
          header={<h3>How do I get access to IDseq?</h3>}
        >
          <p>
            Sed posuere consectetur est at lobortis. Cras mattis consectetur
            purus sit amet fermentum. Integer posuere erat a ante venenatis
            dapibus posuere velit aliquet.
          </p>
        </Accordion>
        <Accordion
          className={cs.question}
          header={<h3>Can I run IDseq offline?</h3>}
        >
          <p>
            Sed posuere consectetur est at lobortis. Cras mattis consectetur
            purus sit amet fermentum. Integer posuere erat a ante venenatis
            dapibus posuere velit aliquet.
          </p>
        </Accordion>
        <h2>Research Data</h2>
        <Accordion
          className={cs.question}
          header={<h3>Cras mattis consectetur purus sit amet fermentum?</h3>}
        >
          <p>
            Sed posuere consectetur est at lobortis. Cras mattis consectetur
            purus sit amet fermentum. Integer posuere erat a ante venenatis
            dapibus posuere velit aliquet.
          </p>
        </Accordion>
        <Accordion
          className={cs.question}
          header={<h3>Can IDseq provide clinical diagnosis?</h3>}
        >
          <p>
            Sed posuere consectetur est at lobortis. Cras mattis consectetur
            purus sit amet fermentum. Integer posuere erat a ante venenatis
            dapibus posuere velit aliquet.
          </p>
        </Accordion>
        <Accordion
          className={cs.question}
          header={<h3>Maecenas sed diam eget risus sit amet non magna?</h3>}
        >
          <p>
            Sed posuere consectetur est at lobortis. Cras mattis consectetur
            purus sit amet fermentum. Integer posuere erat a ante venenatis
            dapibus posuere velit aliquet.
          </p>
        </Accordion>
      </NarrowContainer>
    );
  }
}
