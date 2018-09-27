import React from "react";
import { Button, Form, Input, TextArea, Grid } from "semantic-ui-react";
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

    const accountForm = (
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
          <Form.Field control={TextArea} label="How would you use IDseq?" />
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
          <Grid.Column width={7}>{accountForm}</Grid.Column>
        </Grid>
      </div>
    );

    return (
      <div>
        {header}
        {firstBlock}
      </div>
    );
  }
}

export default Landing;
