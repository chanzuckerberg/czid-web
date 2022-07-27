import React, { useEffect, useRef } from "react";
import cs from "./section.scss";

interface SectionProps {
  id: string,
  name: string,
  observer: IntersectionObserver,
  children: React.ReactNode;
}

const Section = ({ children, id, name, observer } : SectionProps) => {
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

export default Section;
