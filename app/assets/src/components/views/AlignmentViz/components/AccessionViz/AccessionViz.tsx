import React from "react";
import { useWithAnalytics, WithAnalyticsType } from "~/api/analytics";
import ReadViz from "./components/ReadViz";

interface AccessionVizProps {
  accession?: string;
  coverageSummary?: object;
  name?: string;
  reads?: string | number[] | string[][][];
  readsPerPage?: number;
  ref_link?: string;
  ref_seq?: string;
  ref_seq_len?: number;
  reads_count?: number;
}

interface AccessionVizWithAnalyticsProps extends AccessionVizProps {
  withAnalytics: WithAnalyticsType;
}

interface AccessionVizState {
  reads: [
    string | undefined,
    string | undefined,
    number | string[] | undefined,
    string[],
  ][];
  rendering: boolean;
}

class AccessionVizCC extends React.Component<
  AccessionVizWithAnalyticsProps,
  AccessionVizState
> {
  allReads: $TSFixMe;
  coverageSummary: $TSFixMe;
  readsPerPage: $TSFixMe;
  constructor(props: AccessionVizWithAnalyticsProps) {
    super(props);
    this.allReads = props.reads;
    this.readsPerPage = props.readsPerPage;
    this.coverageSummary = props.coverageSummary || {};
    this.renderMoreReads = this.renderMoreReads.bind(this);
    this.state = {
      reads: this.allReads.slice(0, this.readsPerPage),
      rendering: true,
    };
  }

  componentDidUpdate() {
    this.setState({
      rendering: false,
    });
  }

  renderMoreReads() {
    const numReads = this.state.reads.length;
    const nextPageReads = this.allReads.slice(
      numReads,
      numReads + this.readsPerPage,
    );
    this.setState(prevState => ({
      reads: [...prevState.reads, ...nextPageReads],
    }));
  }

  renderCoverageTable(coverageTable: $TSFixMe) {
    return (
      <div>
        <h5> Coverage Details </h5>
        <table style={{ overflowX: "scroll", border: "1px solid" }}>
          <tbody>
            <tr>
              <td>Read Count</td>
              {coverageTable.map((item: $TSFixMe, i: $TSFixMe) => {
                return <td key={`count_${i}`}>{item[1]}</td>;
              })}
            </tr>
            <tr>
              <td>Position Range</td>
              {coverageTable.map((item: $TSFixMe, i: $TSFixMe) => {
                return <td key={`position_${i}`}>{item[0]}</td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  renderCoverageSummary(cs: $TSFixMe) {
    const readLength = cs.total_read_length / cs.num_reads;
    const avgAlignedLength = cs.total_aligned_length / cs.num_reads;
    const avgAlignedPct = (avgAlignedLength / readLength) * 100;
    const mismatchedPct =
      (cs.total_mismatched_length / cs.total_aligned_length) * 100;
    const coverage = (cs.total_aligned_length / cs.ref_seq_len) * 100;
    const distinctCoverage =
      (cs.distinct_covered_length / cs.ref_seq_len) * 100;
    return (
      <div>
        Read Length:<b> {readLength} </b>, Average Aligned Length:{" "}
        <b>
          {" "}
          {avgAlignedLength.toFixed(2)} ({avgAlignedPct.toFixed(2)} %){" "}
        </b>
        , Mismatched Percenage:<b> {mismatchedPct.toFixed(2)} % </b> <br />
        Total Aligned bps:<b> {cs.total_aligned_length} </b>, Coverage:{" "}
        <b> {coverage} % </b> <br />
        Distinct Aligned bps:<b> {cs.distinct_covered_length} </b>, Distinct
        Coverage:<b>{distinctCoverage} %</b>
      </div>
    );
  }

  render() {
    const coverageTable = this.coverageSummary.coverage
      ? this.renderCoverageTable(this.coverageSummary.coverage)
      : null;
    const coverageSummary = this.coverageSummary.total_read_length
      ? this.renderCoverageSummary(this.coverageSummary)
      : null;
    const renderMoreLink =
      this.state.reads.length < this.allReads.length &&
      !this.state.rendering ? (
        <div style={{ textAlign: "right" }}>
          <a onClick={this.renderMoreReads} style={{ cursor: "pointer" }}>
            View more reads
          </a>
        </div>
      ) : null;
    return (
      <div>
        <h3>
          {" "}
          {this.props.accession} : {this.props.name}{" "}
        </h3>
        <b> Reference Sequence:</b> {this.props.ref_seq} <br />
        <b> Reference Sequence Length: </b> {this.props.ref_seq_len},{" "}
        <b>
          <a href={this.props.ref_link}>NCBI URL</a>
        </b>
        ,<b> {this.props.reads_count} </b>aligned reads
        <br />
        {coverageSummary}
        {coverageTable}
        <h5>Reads</h5>
        {this.state.reads.map(function (read, i) {
          return (
            <ReadViz
              key={`read_${i}`}
              name={read[0]}
              sequence={read[1]}
              metrics={read[2]}
              refInfo={read[3]}
            />
          );
        })}
        {renderMoreLink}
        <hr />
      </div>
    );
  }
}

// Using a function component wrapper provides a semi-hacky way to
// access useContext without the class component to function component
// conversion.
export const AccessionViz = (props: AccessionVizProps) => {
  const withAnalytics = useWithAnalytics();

  return <AccessionVizCC {...props} withAnalytics={withAnalytics} />;
};
