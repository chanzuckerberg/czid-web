import { Icon } from "czifui";
import React, { LegacyRef, useEffect, useRef, useState } from "react";
import { getTaxonDistributionForBackground } from "~/api";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import Histogram, {
  HISTOGRAM_SCALE,
} from "~/components/visualizations/Histogram";
import { Background } from "~/interface/shared/specific";
import { TaxonValuesType } from "../TaxonDetailsMode";
import cs from "./taxon_histogram.scss";

interface TaxonHistogramProps {
  background: Background;
  taxonId: number;
  taxonValues: TaxonValuesType;
}

export const TaxonHistogram = ({
  background,
  taxonId,
  taxonValues,
}: TaxonHistogramProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [shouldShowHistogram, setShouldShowHistogram] =
    useState<boolean>(false);
  const [histogramRpmSeries, setHistogramRpmSeries] =
    useState<number[][]>(null);

  const histogramContainerRef: LegacyRef<HTMLDivElement> = useRef(null);
  let histogram: Histogram;

  const loadBackgroundInfo = async () => {
    if (!background || !taxonId || !taxonValues) {
      return Promise.resolve();
    }

    histogram = null;

    try {
      const data = await getTaxonDistributionForBackground(
        background.id,
        taxonId,
      );

      if (data?.NT?.rpm_list && data?.NR?.rpm_list) {
        const rpmSeries = [data.NT.rpm_list, data.NR.rpm_list];

        setHistogramRpmSeries(rpmSeries);
        setShouldShowHistogram(true);
      }
    } catch (error) {
      // TODO: properly handle error
      // eslint-disable-next-line no-console
      console.error("Unable to retrieve background info", error);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    setHistogramRpmSeries(null);
    setShouldShowHistogram(false);
    loadBackgroundInfo();
  }, [background, taxonId]);

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
    if (!isLoading && shouldShowHistogram) renderHistogram();
  }, [isLoading]);

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
      <div className={cs.histogram} ref={histogramContainerRef} />
    </>
  );
};
