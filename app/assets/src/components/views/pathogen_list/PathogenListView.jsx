import { groupBy, sortBy } from "lodash/fp";
import React, { useState, useEffect } from "react";
import { Grid } from "semantic-ui-react";

import { ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import { getPathogenList } from "~/api/pathogen_lists";
import { NarrowContainer } from "~/components/layout";
import List from "~/components/ui/List";
import ExternalLink from "~/components/ui/controls/ExternalLink";

import cs from "./pathogen_list_view.scss";

const PathogenListView = () => {
  const [pathogenList, setPathogenList] = useState(null);
  const [categorizedPathogens, setCategorizedPathogens] = useState([]);

  useEffect(async () => {
    const result = await getPathogenList();
    const alphabetizedPathogens = sortBy("name", result["pathogens"]);
    const categorizedPathogens = groupBy("category", alphabetizedPathogens);
    setPathogenList(result);
    setCategorizedPathogens(categorizedPathogens);
  }, []);

  const renderIntro = () => (
    <>
      <div className={cs.title}>
        <h1>IDseq Pathogen List</h1>
        <h4 className={cs.subtitle}>
          Last Updated: {pathogenList["updated_at"]}. IDseq Pathogen List v
          {pathogenList["version"]}.
        </h4>
      </div>
      <div className={cs.intro}>
        <p>
          This list includes pathogens with known pathogenicity in
          immunocompetent human hosts as well as a few common causes of disease
          in immunocompromised human hosts{" "}
          <a href={window.location.pathname + "#citations"}>
            [1-{pathogenList["citations"].length}]
          </a>
          . It serves to highlight organisms with known pathogenicity in humans,
          but may not be fully comprehensive. Thus, researchers should reference
          the literature for rare causes of disease. Additionally, some of these
          organisms are known pathobionts - commensals within particular body
          sites (ie Candida aureus may be found in the lung without causing an
          infection), and should be interpreted with respect to the literature.
        </p>
        <p>
          Reach out to <a href="mailto:help@idseq.net">help@idseq.net</a> to
          help us make the list better, or if there is any questions or
          comments. We are excited to hear from you!
        </p>
      </div>
    </>
  );

  const renderPathogenList = () => (
    <div className={cs.pathogenList}>
      {Object.keys(categorizedPathogens).map((category, key) => (
        <div key={key}>
          <div className={cs.category}>{category}</div>
          <Grid className={cs.pathogensContainer} columns={3}>
            {categorizedPathogens[category].map((pathogen, index) => (
              <Grid.Column className={cs.pathogen} key={index}>
                <div className={cs.pathogenName}>{pathogen.name}</div>
                <ExternalLink
                  className={cs.pathogenTaxid}
                  href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${pathogen.tax_id}`}
                  analyticsEventName={
                    ANALYTICS_EVENT_NAMES.PATHOGEN_LIST_VIEW_NCBI_LINK_CLICKED
                  }
                >
                  Tax ID: {pathogen.tax_id}
                </ExternalLink>
              </Grid.Column>
            ))}
          </Grid>
        </div>
      ))}
    </div>
  );

  const renderCitations = () => (
    <div className={cs.citations} id={"citations"}>
      <h3>Citations</h3>
      <List
        listClassName={cs.list}
        listItems={pathogenList["citations"].sort()}
        ordered={true}
      ></List>
    </div>
  );

  if (!pathogenList) return null;

  return (
    <NarrowContainer className={cs.pathogenListView} size="small">
      {renderIntro()}
      {renderPathogenList()}
      {renderCitations()}
    </NarrowContainer>
  );
};

export default PathogenListView;
