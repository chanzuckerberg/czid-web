import React from 'react';

class SubHeader extends React.Component {
	render() {
		return (
			<div className="sub-header-component">
				<div className="container">
					<div className="content">
						{ this.props.children }
					</div>
				</div>
			</div>
		);
	}
}
