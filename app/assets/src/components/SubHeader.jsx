import React from 'react';
import PropTypes from 'prop-types';

const SubHeader = (props) => {
  const { children } = props;
  return (
    <div className="sub-header-component">
      <div className="container">
        <div className="content">
          { children }
        </div>
      </div>
    </div>
  );
};

SubHeader.propTypes = {
  children: PropTypes.element
};

SubHeader.defaultProps = {
  children: PropTypes.element
};

export default SubHeader;
