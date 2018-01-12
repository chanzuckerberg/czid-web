import React from 'react';

class ForbiddenPage extends React.Component {
  constructor(props, context) {
    super(props, context);

  }

  render() {
    return (
      <div className="access">Access Denied</div>
    )
  }

}

export default ForbiddenPage;
