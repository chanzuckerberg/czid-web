import React, { Component } from 'react';
import './style.css';

class SubHeader extends Component {
	render() {

		return (
			<div className="sub-header">
				<div className="container">
					<div className="content">
						{ this.props.children }
					</div>
				</div>
				
			</div>
			
		)
	}
}

export default SubHeader;
