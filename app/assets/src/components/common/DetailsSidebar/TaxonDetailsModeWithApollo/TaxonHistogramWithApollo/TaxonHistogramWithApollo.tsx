import { useQuery } from "@apollo/client";
import { Icon } from "czifui";
import React, { LegacyRef, useEffect, useRef, useState } from "react";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import Histogram, {
  HISTOGRAM_SCALE,
} from "~/components/visualizations/Histogram";
import { TaxonDistributionQuery } from "~/gql/generated/graphql";
import { federationClient } from "~/index";
import { Background } from "~/interface/shared/specific";
import { GET_TAXON_DISTRIBUTION } from "../queries";
import { TaxonValuesType } from "../TaxonDetailsModeWithApollo";
import cs from "./taxon_histogram.scss";

interface TaxonHistogramProps {
  background: Background;
  taxonId: number;
  taxonValues: TaxonValuesType;
}

export const TaxonHistogramWithApollo = ({
  background,
  taxonId,
  taxonValues,
}: TaxonHistogramProps) => {
  const [shouldShowHistogram, setShouldShowHistogram] =
    useState<boolean>(false);
  const [histogramRpmSeries, setHistogramRpmSeries] =
    useState<number[][]>(null);

  const histogramContainerRef: LegacyRef<HTMLDivElement> = useRef(null);
  let histogram: Histogram = null;

  const { error, data } = useQuery(GET_TAXON_DISTRIBUTION, {
    variables: {
      backgroundId: background.id,
      taxId: taxonId,
    },
    // TODO: (smccanny): delete this once rails and graphql are integrated under a single client
    client: federationClient,
  });

  if (error) {
    // TODO: properly handle error
    // eslint-disable-next-line no-console
    console.error("Unable to retrieve background info", error);
  }

  const evaluateData = (data: TaxonDistributionQuery) => {
    const dist = data?.taxonDist;
    if (dist?.nt?.rpmList && dist?.nr?.rpmList) {
      const rpmSeries = [dist.nt.rpmList, dist.nr.rpmList];

      setHistogramRpmSeries(rpmSeries);
      setShouldShowHistogram(true);
    }
  };

  const renderHistogram = () => {
    const container = histogramContainerRef?.current;
    histogram = new Histogram(container, histogramRpmSeries, {
      seriesNames: ["NT", "NR"],
      labelX: "rPM+1",
      labelY: "# of Background Samples",
      refValues: [
        {
          name: "this sample",
          values: [taxonValues.NT.rpm, taxonValues.NR.rpm],
        },
      ],
      showStatistics: false,
      xScaleType: HISTOGRAM_SCALE.SYM_LOG,
    });

    histogram.update();
  };

  useEffect(() => {
    setShouldShowHistogram(false);
    evaluateData(data);
  }, [data]);

  useEffect(() => {
    if (shouldShowHistogram) renderHistogram();
  }, [shouldShowHistogram]);

  if (!shouldShowHistogram) return null;

  return (
    <>
      <div className={cs.subtitle}>
        Reference Background: {background.name}
        <ColumnHeaderTooltip
          trigger={
            <span>
              <Icon
                sdsIcon="infoCircle"
                sdsSize="s"
                sdsType="interactive"
                className={cs.infoIcon}
              />
            </span>
          }
          content="This chart shows how abundant (rPM) this taxon is in your
          sample compared to the other samples in the chosen Background Model.
          The farther your sample line is to the right of the other samples, the
          higher the likelihood that this taxon is unique to your sample."
        />
      </div>
      <div
        className={cs.histogram}
        ref={histogramContainerRef}
        data-testid={"taxon-histogram"}
      />
    </>
  );
};
