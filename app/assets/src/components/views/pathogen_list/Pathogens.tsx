import React from "react";
import { Grid } from "semantic-ui-react";

import { ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import ExternalLink from "~/components/ui/controls/ExternalLink";

import cs from "./pathogens.scss";

const Pathogens = ({ pathogens }: PathogensProps) => {
  return (
    <Grid className={cs.pathogensContainer} columns={3}>
      {pathogens.map((pathogen, index) => (
        <Grid.Column className={cs.pathogen} key={index}>
          <div className={cs.pathogenName}>{pathogen.name}</div>
          <ExternalLink
            className={cs.pathogenTaxid}
            href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${pathogen.taxId}`}
            analyticsEventName={
              ANALYTICS_EVENT_NAMES.PATHOGEN_LIST_VIEW_NCBI_LINK_CLICKED
            }
          >
            Tax ID: {pathogen.taxId}
          </ExternalLink>
        </Grid.Column>
      ))}
    </Grid>
  );
};

interface PathogensProps {
  pathogens: {
    name: string;
    taxId: number;
  }[];
}

export default Pathogens;
