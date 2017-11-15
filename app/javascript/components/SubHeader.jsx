import React, { Component } from 'react';

export default class SubHeader extends Component {
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
