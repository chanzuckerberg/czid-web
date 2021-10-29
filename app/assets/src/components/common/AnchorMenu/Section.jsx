import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";
import cs from "./section.scss";

const Section = ({ children, id, name, observer }) => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const { current } = sectionRef;
    if (current && observer) {
      observer.observe(current);
    }

    return () => {
      if (current && observer) observer.unobserve(current);
    };
  }, [observer, sectionRef]);

  return (
    <div className={cs.section} id={id} ref={sectionRef}>
      <h2>{name}</h2>
      {children}
    </div>
  );
};

Section.propTypes = {
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  observer: PropTypes.object,
};

export default Section;
