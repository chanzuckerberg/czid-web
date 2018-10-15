import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import {
  Form,
  Input,
  TextArea,
  Grid,
  Image,
  Message,
  Divider
} from "semantic-ui-react";
import Container from "../ui/containers/Container";
import TransparentButton from "../ui/controls/buttons/TransparentButton";
import PrimaryButton from "../ui/controls/buttons/PrimaryButton";
import StringHelper from "../../helpers/StringHelper";
import DiscoverIcon from "../ui/icons/DiscoverIcon";
import DetectIcon from "../ui/icons/DetectIcon";
import DecipherIcon from "../ui/icons/DecipherIcon";
import LogoIcon from "../ui/icons/LogoIcon";

class Landing extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      firstName: "",
      lastName: "",
      email: "",
      institution: "",
      usage: "",
      submitMessage: ""
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(_, { id, value }) {
    this.setState({ [id]: value });
  }

  handleSubmit() {
    if (!StringHelper.validateEmail(this.state.email)) {
      this.setState({ submitMessage: "Email is invalid." });
      return;
    }

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
      .then(() => {
        this.setState({
          firstName: "",
          lastName: "",
          email: "",
          institution: "",
          usage: "",
          submitMessage: "Form completed. Thanks for your interest!"
        });
      })
      .catch(() => {
        this.setState({
          submitMessage:
            "There was an error submitting the form. Please check required fields and try again."
        });
      });
  }

  render() {
    const signInLink = () => (location.href = "/users/sign_in");
    const header = (
      <div className="header-row row">
        <div className="site-header col s12">
          <div className="left brand-details">
            <a href="/">
              <span className="logo-icon">
                <LogoIcon />
              </span>
            </a>
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
        identify pathogens in metagenomic sequencing data.
      </div>
    );

    const actionCards = (
      <Container>
        <div className="action-cards">
          <div className="action-card">
            <DiscoverIcon />
            <div className="card-text">
              <div className="card-title">Discover</div>
              <div className="card-description">
                Identify the pathogen landscape
              </div>
            </div>
          </div>
          <div className="action-card">
            <DetectIcon />
            <div className="card-text">
              <div className="card-title">Detect</div>
              <div className="card-description">
                Monitor and review potential outbreaks
              </div>
            </div>
          </div>
          <div className="action-card">
            <span className="icon-decipher">
              <DecipherIcon />
            </span>
            <div className="decipher-card-text">
              <div className="card-title">Decipher</div>
              <div className="card-description">
                Find potential infecting organisms in large datasets
              </div>
            </div>
          </div>
        </div>
      </Container>
    );

    const usageLabel = (
      <label>
        How would you use IDseq? <span className="optional">Optional</span>
      </label>
    );

    let submitMessageBanner;
    if (this.state.submitMessage) {
      submitMessageBanner = <Message content={this.state.submitMessage} />;
    }

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
              value={this.state.firstName}
              onChange={this.handleChange}
            />
            <Form.Field
              control={Input}
              label="Last Name"
              id="lastName"
              value={this.state.lastName}
              onChange={this.handleChange}
            />
          </Form.Group>
          <Form.Field
            control={Input}
            label="Email"
            id="email"
            value={this.state.email}
            onChange={this.handleChange}
          />
          <Form.Field
            control={Input}
            label="Affiliated Institution or Company"
            id="institution"
            value={this.state.institution}
            onChange={this.handleChange}
          />
          <Form.Field
            control={TextArea}
            label={usageLabel}
            value={this.state.usage}
            onChange={this.handleChange}
            id="usage"
          />
          {submitMessageBanner}
          <div className="submit-button">
            <PrimaryButton text="Submit" />
          </div>
        </Form>
      </div>
    );

    const firstBlock = (
      <div className="row first-block">
        <Grid container stackable columns={2}>
          <Grid.Column width={9}>
            {topTitle}
            {actionCards}
          </Grid.Column>
          <Grid.Column width={7}>{interestForm}</Grid.Column>
        </Grid>
      </div>
    );

    let bulletinBanner;
    if (this.props.bulletinTitle) {
      bulletinBanner = (
        <div className="bulletin-banner">
          <Container>
            <div className="bulletin-title">{this.props.bulletinTitle}</div>
            <div className="bulletin-description">
              {this.props.bulletinDescription}
            </div>
            <a
              href={this.props.bulletinLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <TransparentButton text="Learn More" />
            </a>
          </Container>
        </div>
      );
    } else {
      bulletinBanner = <Divider />;
    }

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

    const mailto = "mailto:" + this.props.contactEmail;
    const footer = (
      <div className="footer">
        <div className="footer-links">
          <a href={mailto}>Contact</a>
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
        {bulletinBanner}
        {partners}
        {footer}
      </div>
    );
  }
}

Landing.propTypes = {
  contactEmail: PropTypes.string.isRequired,
  bulletinTitle: PropTypes.string,
  bulletinLink: PropTypes.string,
  bulletinDescription: PropTypes.string
};

export default Landing;
