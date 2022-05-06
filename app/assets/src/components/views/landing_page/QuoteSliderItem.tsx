import React from "react";
import IconDoubleQuotes from "~/components/ui/icons/IconDoubleQuotes";
import cs from "./QuoteSliderItem.scss";

interface QuoteSliderItemProps {
  quoteText: string;
  quoteAuthor: string;
  quoteCredentials: string;
  customStyles?: object;
}

const QuoteSliderItem = (props: QuoteSliderItemProps) => {
  return (
    <div className={cs.carouselCell}>
      <div className={cs.quoteContainer} style={props.customStyles}>
        <span className={cs.startQuotation}>
          <IconDoubleQuotes />
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

export default QuoteSliderItem;
