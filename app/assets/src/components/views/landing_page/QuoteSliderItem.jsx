import PropTypes from "prop-types";
import React from "react";
import QuoteMark from "~/images/landing_page/idseq-quote-mark.svg";
import cs from "./QuoteSliderItem.scss";

const QuoteSliderItem = props => {
  return (
    <div className={cs.carouselCell}>
      <div className={cs.quoteContainer}>
        <span className={cs.startQuotation}>
          <img src={QuoteMark} alt="" />
        </span>
        <p>{props.quoteText} &rdquo;</p>
        <div className={cs.quoteCitation}>
          <span className={cs.quoteAuthor}>&#8212; {props.quoteAuthor}</span>
          <p className={cs.quoteCredentials}>{props.quoteCredentials}</p>
        </div>
      </div>
    </div>
  );
};

QuoteSliderItem.propTypes = {
  quoteText: PropTypes.string,
  quoteAuthor: PropTypes.string,
  quoteCredentials: PropTypes.string,
};

export default QuoteSliderItem;
