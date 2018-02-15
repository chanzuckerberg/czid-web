import React from 'react';
import PropTypes from 'prop-types';

/**
 @class StickySidebar
 @desc A generic component for scrollable sticky sidebars
*/
class StickySidebar extends React.Component {
  /**
   * @method getScrollTop
   * @return {Number} the position of window scroll
  */
  static getScrollTop() {
    return (window.pageYOffset !== undefined)
      ? window.pageYOffset : (document.documentElement
      || document.body.parentNode || document.body).scrollTop;
  }

  /**
    * @method constructor
    * @param {Object} props
    * @param {Object} context
    * @desc sets the initial state for component
  */
  constructor(props, context) {
    super(props, context);
    this.state = {
      style: {
        top: 0,
        position: 'relative'
      },
      className: 'react-sticky-sidebar-wrapper'
    };
  }

  /**
    @method componentDidMount
    @desc overiding lifecyle event
  */
  componentDidMount() {
    const wrapper = document.querySelector(`.${this.state.className}`);
    const wrapperOffsetTop = wrapper.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;

    // projectWrapper
    let prevScrollTop = 0;
    let initialScroll = 0;
    let wrapperHeight = wrapper.clientHeight;
    let heightDiff = wrapperHeight - windowHeight;

    window.addEventListener('scroll', () => {
      const scrollTop = StickySidebar.getScrollTop();
      const jumpDiff = Math.abs(scrollTop - prevScrollTop);
      const absInitialScroll = Math.abs(initialScroll);
      if (wrapper.clientHeight !== wrapperHeight) {
        wrapperHeight = wrapper.clientHeight;
        heightDiff = wrapperHeight - windowHeight;
      }
      if (heightDiff > 0) {
        if (scrollTop >= prevScrollTop && scrollTop > wrapperOffsetTop) {
          // scroll passed the header
          if (absInitialScroll < heightDiff) {
            initialScroll -= jumpDiff;
          }
        } else if (scrollTop > wrapperOffsetTop) {
          if (initialScroll < 0) {
            initialScroll += jumpDiff;
          }
        }
        if (absInitialScroll > heightDiff) {
          initialScroll = -(heightDiff);
        } else if (initialScroll > 0) {
          initialScroll = 0;
        }
        this.setState({
          style: Object.assign({}, this.state.style, {
            top: `${initialScroll}px`
          })
        });
      } else {
        this.setState({
          style: Object.assign({}, this.state.style, {
            top: '0px'
          })
        });
      }
      prevScrollTop = scrollTop;
    });
  }

  /**
    @method render
    @return {Object} jsx object
  */
  render() {
    return (
      <div style={this.state.style} className={this.state.className}>
        {this.props.children}
      </div>
    );
  }
}

StickySidebar.propTypes = {
  children: PropTypes.element
};

StickySidebar.defaultProps = {
  children: PropTypes.element
};

export default StickySidebar;
