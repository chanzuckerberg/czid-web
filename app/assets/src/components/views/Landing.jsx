import React from "react";
import { Form, Input, TextArea, Grid, Image } from "semantic-ui-react";
import TransparentButton from "../ui/controls/buttons/TransparentButton";
import PrimaryButton from "../ui/controls/buttons/PrimaryButton";

class Landing extends React.Component {
  render() {
    const link = () => (location.href = "/users/sign_in");
    const header = (
      <div className="header-row row">
        <div className="site-header col s12">
          <div className="left brand-details">
            <span className="col s1 logo-label">IDseq</span>
          </div>
          <div className="sign-in">
            <TransparentButton text="Sign In" onClick={link} />
          </div>
        </div>
      </div>
    );

    const topTitle = (
      <div className="top-title">
        IDseq is an unbiased global software platform that helps scientists
        identify pathogens in metagenomic data.
      </div>
    );

    const actionCards = (
      <div className="action-cards">
        <div className="action-card">
          <div className="card-title">Discover</div>
          <div className="card-description">
            Identify the pathogen landscape
          </div>
        </div>
        <div className="action-card">
          <div className="card-title">Detect</div>
          <div className="card-description">
            Monitor and review potential outbreaks
          </div>
        </div>
        <div className="action-card">
          <div className="card-title">Decipher</div>
          <div className="card-description">
            Find potential infecting organisms in large datasets
          </div>
        </div>
      </div>
    );

    const usageLabel = (
      <label>
        How would you use IDseq? <span className="optional">Optional</span>
      </label>
    );
    const interestForm = (
      <div className="account-form">
        <div className="form-header">
          <div className="form-title">Learn more about IDseq</div>
          <div className="form-description">
            Already have an account? <a href="/users/sign_in">Sign in.</a>
          </div>
        </div>
        <Form>
          <Form.Group widths={2}>
            <Form.Field control={Input} label="First Name" />
            <Form.Field control={Input} label="Last Name" />
          </Form.Group>
          <Form.Field control={Input} label="Email" />
          <Form.Field
            control={Input}
            label="Affiliated Institution or Company"
          />
          <Form.Field control={TextArea} label={usageLabel} />
          <div className="submit-button">
            <PrimaryButton text="Submit" />
          </div>
        </Form>
      </div>
    );

    const firstBlock = (
      <div className="row first-block">
        <Grid stackable columns={2}>
          <Grid.Column width={9}>
            {topTitle}
            {actionCards}
          </Grid.Column>
          <Grid.Column width={7}>{interestForm}</Grid.Column>
        </Grid>
      </div>
    );

    const partners = (
      <div className="partners-block">
        <div className="partner-title">IN PARTNERSHIP WITH</div>
        <Grid columns={2} className="partner-logos">
          <Grid.Column>
            <Image
              className="first-logo"
              src="/assets/logo-czi.jpg"
              as="a"
              href="https://www.chanzuckerberg.com/"
              target="_blank"
              rel="noopener noreferrer"
            />
          </Grid.Column>
          <Grid.Column>
            <Image
              className="second-logo"
              src="/assets/logo-biohub.jpg"
              as="a"
              href="https://www.czbiohub.org/"
              target="_blank"
              rel="noopener noreferrer"
            />
          </Grid.Column>
        </Grid>
      </div>
    );

    const footer = (
      <div className="footer">
        <div className="footer-links">
          <a href="mailto:accounts@idseq.net">Contact</a>
          <a
            href="https://s3-us-west-2.amazonaws.com/idseq-database/Terms.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms
          </a>
          <a
            href="https://s3-us-west-2.amazonaws.com/idseq-database/Privacy.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy
          </a>
        </div>
      </div>
    );

    return (
      <div>
        {header}
        {firstBlock}
        {partners}
        {footer}
      </div>
    );
  }
}

export default Landing;
