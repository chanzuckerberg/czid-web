import React from "react";
import BasicPopup from "~/components/BasicPopup";
import PropTypes from "prop-types";
import cs from "./column_header_tooltip.scss";

class ColumnHeaderTooltip extends React.Component {
  render() {
    const { title, content, list, link } = this.props;
    return (
      <BasicPopup
        {...this.props}
        content={
          <div className={cs.tooltip}>
            {title && <span className={cs.title}>{title}:</span>}
            {content}
            {list && (
              <ul className={cs.ul}>
                {" "}
                {list.map(item => {
                  return (
                    <li className={cs.li} key={item}>
                      {item}
                    </li>
                  );
                })}{" "}
              </ul>
            )}
            {link && (
              <a
                className={cs.link}
                target="_blank"
                rel="noopener noreferrer"
                href={link}
              >
                Learn more.
              </a>
            )}
          </div>
        }
      />
    );
  }
}

ColumnHeaderTooltip.propTypes = {
  size: PropTypes.string,
  title: PropTypes.string,
  link: PropTypes.string,
  list: PropTypes.arrayOf(PropTypes.string),
};

ColumnHeaderTooltip.defaultProps = {
  basic: false,
  hoverable: true,
  inverted: false,
  size: "small",
  position: "top center",
};

export default ColumnHeaderTooltip;
