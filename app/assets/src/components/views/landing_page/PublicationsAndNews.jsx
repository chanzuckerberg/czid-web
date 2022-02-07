import PropTypes from "prop-types";
import React from "react";
import { IconArrowRight } from "~ui/icons";
import cs from "./PublicationsAndNews.scss";
import { publicationsData, newsData } from "./PublicationsAndNewsData";

const PublicationEntry = props => {
  return (
    <li className={cs.publication} key={props.index}>
      <a href={props.publicationLink} target="_blank" rel="noopener noreferrer">
        <time className={cs.date}>
          {props.publicationDate} - {props.publicationCompany}
        </time>
        <h3 className={cs.title}>{props.publicationTitle}</h3>
        <p className={cs.source}>{props.publicationSource}</p>
        <p className={cs.readMore}>
          Read More <IconArrowRight />
        </p>
      </a>
    </li>
  );
};

const NewsEntry = props => {
  return (
    <li className={cs.publication} key={props.index}>
      <a href={props.publicationLink} target="_blank" rel="noopener noreferrer">
        <time className={cs.date}>
          {props.publicationDate} - {props.publicationCompany}
        </time>
        <h3 className={cs.title}>{props.publicationTitle}</h3>
        <p className={cs.readMore}>
          Read More <IconArrowRight />
        </p>
      </a>
    </li>
  );
};

const PublicationsAndNewsPropTypes = {
  index: PropTypes.number,
  publicationLink: PropTypes.string,
  publicationDate: PropTypes.string,
  publicationTitle: PropTypes.string,
  publicationSource: PropTypes.string,
  publicationCompany: PropTypes.string,
};

PublicationEntry.propTypes = PublicationsAndNewsPropTypes;
NewsEntry.propTypes = PublicationsAndNewsPropTypes;

const Publications = () => {
  return (
    <div className={cs.publications}>
      <h2>Scientific Publications</h2>
      <ul>
        {publicationsData &&
          publicationsData.map((entry, index) => {
            return (
              <PublicationEntry
                key={index}
                publicationLink={entry.publicationLink}
                publicationDate={entry.publicationDate}
                publicationTitle={entry.publicationTitle}
                publicationSource={entry.publicationSource}
                publicationCompany={entry.publicationCompany}
              />
            );
          })}
      </ul>
    </div>
  );
};

const News = () => {
  return (
    <div className={cs.news}>
      <h2>CZ ID in the News</h2>
      <ul>
        {newsData &&
          newsData.map((entry, index) => {
            return (
              <PublicationEntry
                key={index}
                publicationLink={entry.publicationLink}
                publicationDate={entry.publicationDate}
                publicationTitle={entry.publicationTitle}
                publicationCompany={entry.publicationCompany}
              />
            );
          })}
      </ul>
    </div>
  );
};

export { Publications, News };
