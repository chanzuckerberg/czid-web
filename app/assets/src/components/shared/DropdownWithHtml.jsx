import React from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import { Dropdown } from 'semantic-ui-react';

class DropdownWithHtml extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      active: false
    };
  }
  componentDidMount() {
    // dropdown
    const { compact, slideSpeed } = this.props;

    const dropDowncontainer = $(this.refs._dropdown_container);
    const activator = this.refs._dropdown_activator;
    const filterContent = this.refs._dropdown_content;
    const $filterContent = $(filterContent);
    const body = document.querySelector('body');
    activator.handleClick = (e) => {
      $filterContent.slideToggle(slideSpeed);
    }
    body.addEventListener('click', (e) => {
      const targetClassName = e.target.className;
      const activatorClassName = activator.ref.className;
      if (targetClassName === filterContent.className
        || targetClassName === activatorClassName
        || filterContent.contains(e.target)
        || activator.ref.contains(e.target) ) {
        return false;
      }
      $filterContent.slideUp(slideSpeed);
    });
    if (compact) {
      filterContent.style.minWidth = `${dropDowncontainer.width()}px`;
    }
  }
  render() {
    const { children, text } = this.props;
    return (
      <div  ref="_dropdown_container" className={`${this.props.className} __custom _dropdown-container`}>
        <Dropdown
          ref="_dropdown_activator"
          className="__custom _dropdown-activator"
          item
          text={text}/>
        <div ref="_dropdown_content" className="__custom _dropdown-content">
          { children }
        </div>
      </div>
    )
  }
}

DropdownWithHtml.propTypes = {
  children: PropTypes.element,
  slideSpeed: PropTypes.number,
  compact: PropTypes.bool,
  text: PropTypes.string
};

DropdownWithHtml.defaultProps = {
  children: PropTypes.element,
  slideSpeed: 100,
  compact: true,
  text: PropTypes.string.isRequired
};

export default DropdownWithHtml;
