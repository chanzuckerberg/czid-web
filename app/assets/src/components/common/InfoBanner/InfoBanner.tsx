import cx from "classnames";
import React from "react";
import ExternalLink from "~ui/controls/ExternalLink";
import Link from "~ui/controls/Link";
import { IconArrowRight } from "~ui/icons";
import ImgSearchSecondary from "~ui/illustrations/ImgSearchSecondary";
import cs from "./info_banner.scss";

interface InfoBannerProps {
  className?: string;
  contentClassName?: string;
  listenerLink?: {
    text: string;
    onClick: $TSFixMeFunction;
  };
  icon?: React.ReactNode;
  iconClassName?: string;
  link?:
    | {
        text: string;
        href: string;
        external?: boolean;
      }
    | {
        text: string;
        href: string;
        external?: boolean;
      }[];
  message?: React.ReactNode;
  messageClassName?: string;
  suggestion?: string;
  title?: string;
  titleClassName?: string;
  type?: string;
}

export const InfoBanner = ({
  className,
  contentClassName,
  listenerLink,
  icon = <ImgSearchSecondary className={cs.icon} />,
  iconClassName,
  link,
  message,
  messageClassName,
  suggestion,
  title,
  titleClassName,
}: InfoBannerProps) => {
  const renderListenerLink = () => {
    // listenerLink will look like a link but instead of having an href, it has an onClick
    return (
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      <span className={cs.link} onClick={listenerLink.onClick}>
        {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
        {listenerLink.text} <IconArrowRight />
      </span>
    );
  };

  const renderLinks = () => {
    if (Array.isArray(link)) {
      return link.map(linkObj => renderLink(linkObj));
    } else {
      return renderLink(link);
    }
  };

  const renderLink = linkObj => {
    if (linkObj.external) {
      return (
        <ExternalLink className={cs.link} href={linkObj.href}>
          {linkObj.text}
          <IconArrowRight />
        </ExternalLink>
      );
    } else {
      return (
        <Link className={cs.link} href={linkObj.href}>
          {linkObj.text}
          <IconArrowRight />
        </Link>
      );
    }
  };

  return (
    <div className={cx(cs.container, className)}>
      <div className={cx(cs.content, contentClassName)}>
        {title && <div className={cx(cs.title, titleClassName)}>{title}</div>}
        {message && (
          <div className={cx(cs.message, messageClassName)}>{message}</div>
        )}
        {suggestion && <div className={cs.suggestion}>{suggestion}</div>}
        {listenerLink && renderListenerLink()}
        {!listenerLink && link && renderLinks()}
      </div>
      <div className={cx(cs.icon, iconClassName)}>{icon}</div>
    </div>
  );
};
