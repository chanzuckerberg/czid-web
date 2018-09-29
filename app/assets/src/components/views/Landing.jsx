import React from "react";
import axios from "axios";
import { Form, Input, TextArea, Grid, Image } from "semantic-ui-react";
import TransparentButton from "../ui/controls/buttons/TransparentButton";
import PrimaryButton from "../ui/controls/buttons/PrimaryButton";
import IconComponent from "../IconComponent";

class Landing extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      firstName: "",
      lastName: "",
      email: "",
      institution: "",
      usage: ""
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(_, { id, value }) {
    this.setState({ [id]: value });
  }

  handleSubmit() {
    console.log("cur state: ", this.state);

    axios
      .post("sign_up", {
        signUp: {
          firstName: this.state.firstName,
          lastName: this.state.lastName,
          email: this.state.email,
          institution: this.state.institution,
          usage: this.state.usage
        }
      })
      .then(response => {
        console.log("got response: ", response);
      })
      .catch(error => {
        console.log("error: ", error);
      });
  }

  render() {
    const signInLink = () => (location.href = "/users/sign_in");
    const header = (
      <div className="header-row row">
        <div className="site-header col s12">
          <div className="left brand-details">
            <span className="col s1 logo-label">IDseq</span>
          </div>
          <div className="sign-in">
            <TransparentButton text="Sign In" onClick={signInLink} />
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
          {IconComponent.discover("#3867fa")}
          <div className="card-text">
            <div className="card-title">Discover</div>
            <div className="card-description">
              Identify the pathogen landscape
            </div>
          </div>
        </div>
        <div className="action-card">
          {IconComponent.detect("#3867fa")}
          <div className="card-text">
            <div className="card-title">Detect</div>
            <div className="card-description">
              Monitor and review potential outbreaks
            </div>
          </div>
        </div>
        <div className="action-card">
          {IconComponent.decipher("#3867fa")}
          <div className="card-text">
            <div className="card-title">Decipher</div>
            <div className="card-description">
              Find potential infecting organisms in large datasets
            </div>
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
        <Form onSubmit={this.handleSubmit}>
          <Form.Group widths={2}>
            <Form.Field
              control={Input}
              label="First Name"
              id="firstName"
              onChange={this.handleChange}
            />
            <Form.Field
              control={Input}
              label="Last Name"
              id="lastName"
              onChange={this.handleChange}
            />
          </Form.Group>
          <Form.Field
            control={Input}
            label="Email"
            id="email"
            onChange={this.handleChange}
          />
          <Form.Field
            control={Input}
            label="Affiliated Institution or Company"
            id="institution"
            onChange={this.handleChange}
          />
          <Form.Field
            control={TextArea}
            label={usageLabel}
            onChange={this.handleChange}
            id="usage"
          />
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
