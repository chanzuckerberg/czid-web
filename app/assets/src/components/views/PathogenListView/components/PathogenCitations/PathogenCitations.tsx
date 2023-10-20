import React from "react";
import List from "~/components/ui/List";
import cs from "../../pathogen_list_view.scss";

interface PathogenCitationsProps {
  citations: readonly string[];
}

export const PathogenCitations = ({ citations }: PathogenCitationsProps) => {
  return (
    <div className={cs.citations} id={"citations"}>
      <h3>Citations</h3>
      <List
        listClassName={cs.list}
        listItems={[...citations].sort()}
        ordered={true}
      ></List>
    </div>
  );
};
