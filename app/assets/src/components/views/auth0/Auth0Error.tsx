import { upperFirst } from "lodash/fp";
import React from "react";
import BlankScreenMessage from "~/components/common/BlankScreenMessage";
import { CONTACT_US_LINK } from "~/components/utils/documentationLinks";
import ImgMicrobeSecondary from "~ui/illustrations/ImgMicrobeSecondary";
import cs from "./auth0_error.scss";

interface Auth0ErrorProps {
  message?: string;
}

class Auth0Error extends React.Component<Auth0ErrorProps> {
  render() {
    const { message } = this.props;
    return (
      <div className={cs.auth0Error}>
        <BlankScreenMessage
          message={upperFirst(message)}
          textWidth={300}
          tagline={
            <a
              className={cs.helpLink}
              href={CONTACT_US_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact us for help
            </a>
          }
          icon={<ImgMicrobeSecondary className={cs.imgMicrobe} />}
        />
      </div>
    );
  }
}

export default Auth0Error;
