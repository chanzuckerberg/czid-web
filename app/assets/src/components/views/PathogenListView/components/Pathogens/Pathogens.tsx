import React from "react";
import { Grid } from "semantic-ui-react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import cs from "./pathogens.scss";

interface PathogensProps {
  pathogensByHeader: {
    name: string;
    taxId: number;
  }[];
}

export const Pathogens = ({ pathogensByHeader }: PathogensProps) => {
  return (
    <Grid className={cs.pathogensContainer} columns={3}>
      {pathogensByHeader.map((pathogen, index) => (
        <Grid.Column className={cs.pathogen} key={index}>
          <div className={cs.pathogenName}>{pathogen.name}</div>
          <ExternalLink
            className={cs.pathogenTaxid}
            href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${pathogen.taxId}`}
          >
            Tax ID: {pathogen.taxId}
          </ExternalLink>
        </Grid.Column>
      ))}
    </Grid>
  );
};
