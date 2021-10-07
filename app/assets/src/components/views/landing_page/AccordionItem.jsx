import PropTypes from "prop-types";
import React from "react";
import cs from "./AccordionItem.scss";

const AccordionItem = props => {
  return (
    <div
      onClick={props.onClick}
      onKeyDown={props.onClick}
      className={`${cs.accordion} accordionItem`}
    >
      {props.isOpen ? (
        <svg
          className="icon"
          width="20"
          height="21"
          viewBox="0 0 20 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="9.80701" cy="10.2426" r="9.80701" fill="#3867FA" />
          <path d="M5.00977 10.2422L14.6045 10.2422" stroke="white" />
        </svg>
      ) : (
        <svg
          className="icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className={cs.plusStroke}
            cx="9.80701"
            cy="9.80701"
            r="9.30701"
            stroke="#999999"
          />
          <path
            className={cs.plusStroke}
            d="M9.80701 5.00977V14.6045"
            stroke="#999999"
          />
          <path
            className={cs.plusStroke}
            d="M5.00964 9.80713L14.6044 9.80713"
            stroke="#999999"
          />
        </svg>
      )}
      <span
        className={cs.accordionTitle}
        style={props.isOpen ? { color: "#3867FA" } : null}
      >
        {props.accordionTitle}
      </span>
      <div className={cs.panel}>
        <p className={cs.accordionText}>{props.accordionText}</p>
      </div>
    </div>
  );
};

AccordionItem.propTypes = {
  accordionTitle: PropTypes.string.isRequired,
  accordionText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  isOpen: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default AccordionItem;
