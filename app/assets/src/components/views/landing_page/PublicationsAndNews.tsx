import React from "react";
import { IconArrowRight } from "~ui/icons";
import cs from "./PublicationsAndNews.scss";
import { publicationsData, newsData } from "./PublicationsAndNewsData";

interface EntryListProps {
  className: string;
  title: string;
  data: {
    publicationLink: string;
    publicationDate: string;
    publicationTitle: string;
    publicationCompany: string;
    publicationSource?: string;
  }[];
}

const EntryList = (props: EntryListProps) => {
  return (
    <div className={props.className}>
      <h2>{props.title}</h2>
      <ul>
        {props.data &&
          props.data.map((entry, index) => {
            return (
              <li className={cs.publication} key={index}>
                <a
                  href={entry.publicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <time className={cs.date}>
                    {entry.publicationDate} - {entry.publicationCompany}
                  </time>
                  <h3 className={cs.title}>{entry.publicationTitle}</h3>
                  {entry.publicationSource && (
                    <p className={cs.source}>{entry.publicationSource}</p>
                  )}
                  <p className={cs.readMore}>
                    Read More <IconArrowRight />
                  </p>
                </a>
              </li>
            );
          })}
      </ul>
    </div>
  );
};

const Publications = () => {
  return (
    <EntryList
      className={cs.publications}
      title="Scientific Publications"
      data={publicationsData}
    />
  );
};

const News = () => {
  return (
    <EntryList className={cs.news} title="CZ ID in the News" data={newsData} />
  );
};

export { Publications, News };
