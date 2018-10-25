import Dropzone from "react-dropzone";
import PropTypes from "prop-types";
import React from "react";

class UploadBox extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let cname = "idseq-ui upload-box";
    if (this.props.className) {
      cname += ` ${this.props.className}`;
    }

    return (
      <Dropzone {...this.props} className={cname}>
        {this.props.children}
      </Dropzone>
    );
  }
}

UploadBox.propTypes = {
  className: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default UploadBox;
