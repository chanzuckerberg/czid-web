import cx from "classnames";
import React from "react";
import { Popup } from "semantic-ui-react";
import { getAlignmentData } from "~/api";
import { getSampleMetadata } from "~/api/metadata";
import {
  ASSEMBLY_FEATURE,
  isPipelineFeatureAvailable,
} from "~/components/utils/pipeline_versions";
import { SampleId } from "~/interface/shared";
import cs from "./alignment_viz.scss";
import { AccessionViz } from "./components/AccessionViz";

interface AlignmentVizProps {
  alignmentQuery?: string;
  pipelineVersion?: string;
  readsPerPage?: number;
  sampleId: SampleId;
  taxId?: string;
  taxLevel?: string;
  taxName?: string;
}

interface AlignmentVizState {
  alignmentData: object[] | { error: string };
  pipelineRun: { pipeline_version: string } | null;
  loading: boolean;
}

export class AlignmentViz extends React.Component<
  AlignmentVizProps,
  AlignmentVizState
> {
  alignmentQuery: string;
  pipelineVersion: string;
  readsPerPage: number;
  sampleId: SampleId;
  taxId: string;
  taxLevel: string;
  taxName: string;
  constructor(props: AlignmentVizProps) {
    super(props);
    this.sampleId = props.sampleId;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this.alignmentQuery = props.alignmentQuery;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this.taxId = props.taxId;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this.taxLevel = props.taxLevel;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this.taxName = props.taxName;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this.pipelineVersion = props.pipelineVersion;
    this.readsPerPage = props.readsPerPage || 20;
    this.state = {
      alignmentData: [],
      pipelineRun: null,
      loading: true,
    };
  }

  async componentDidMount() {
    const { sampleId } = this.props;

    // TODO(mark): Remove the metadata call once the alignment viz takes assembly into account.
    const [alignmentData, metadata] = await Promise.all([
      getAlignmentData(
        sampleId.toString(),
        this.alignmentQuery,
        this.pipelineVersion,
      ),
      getSampleMetadata({
        id: sampleId,
        pipelineVersion: this.pipelineVersion,
      }),
    ]);

    this.setState({
      loading: false,
      alignmentData,
      pipelineRun: metadata.additional_info.pipeline_run,
    });
  }

  render() {
    const { loading, alignmentData, pipelineRun } = this.state;
    if (loading) {
      return (
        <div>
          <h2 className={cs.heading}>
            Loading alignment data for {this.taxName} ({this.taxLevel}) ...
          </h2>
        </div>
      );
    } else if (Array.isArray(alignmentData)) {
      return (
        <div>
          <h2 className={cs.heading}>
            {this.taxName ? this.taxName + " (" + this.taxLevel + ")" : ""}
            Alignment ({alignmentData.length} unique accessions)
            {pipelineRun &&
              isPipelineFeatureAvailable(
                ASSEMBLY_FEATURE,
                pipelineRun.pipeline_version,
              ) && (
                <Popup
                  trigger={
                    <i
                      className={cx("fa fa-exclamation-circle", cs.warningIcon)}
                    />
                  }
                  position="bottom left"
                  content={`
              Only alignments of individual reads are listed. Contig assembly is not currently included.
            `}
                  inverted
                  wide="very"
                  horizontalOffset={4}
                  className={cs.popup}
                />
              )}
          </h2>
          <div className={cs.accessionViz}>
            {alignmentData.map(function (this: $TSFixMe, item, i) {
              return (
                <AccessionViz
                  key={`accession_${i}`}
                  readsPerPage={this.readsPerPage}
                  {...item}
                />
              );
            }, this)}
          </div>
        </div>
      );
    } else {
      return <div>{alignmentData.error}</div>;
    }
  }
}

export default AlignmentViz;
