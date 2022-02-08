import PropTypes from "prop-types";
import React from "react";

import { withAnalytics } from "~/api/analytics";
import ReadViz from "./ReadViz";

class AccessionViz extends React.Component {
  constructor(props) {
    super();
    this.allReads = props.reads;
    this.readsPerPage = props.readsPerPage;
    this.coverageSummary = props.coverageSummary || {};
    this.renderMoreReads = this.renderMoreReads.bind(this);
    this.state = {
      reads: this.allReads.slice(0, this.readsPerPage),
      rendering: true,
    };
  }

  componentDidUpdate(_prevProps, _prevState) {
    this.setState({
      rendering: false,
    });
  }

  renderMoreReads() {
    const numReads = this.state.reads.length;
    let nextPageReads = this.allReads.slice(
      numReads,
      numReads + this.readsPerPage,
    );
    this.setState(prevState => ({
      reads: [...prevState.reads, ...nextPageReads],
    }));
  }

  renderCoverageTable(coverageTable) {
    return (
      <div>
        <h5> Coverage Details </h5>
        <table style={{ overflowX: "scroll", border: "1px solid" }}>
          <tbody>
            <tr>
              <td>Read Count</td>
              {coverageTable.map((item, i) => {
                return <td key={`count_${i}`}>{item[1]}</td>;
              })}
            </tr>
            <tr>
              <td>Position Range</td>
              {coverageTable.map((item, i) => {
                return <td key={`position_${i}`}>{item[0]}</td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  renderCoverageSummary(cs) {
    let readLength = cs.total_read_length / cs.num_reads;
    let avgAlignedLength = cs.total_aligned_length / cs.num_reads;
    let avgAlignedPct = (avgAlignedLength / readLength) * 100;
    let mismatchedPct =
      (cs.total_mismatched_length / cs.total_aligned_length) * 100;
    let coverage = (cs.total_aligned_length / cs.ref_seq_len) * 100;
    let distinctCoverage = (cs.distinct_covered_length / cs.ref_seq_len) * 100;
    return (
      <div>
        Read Length: <b> {readLength} </b>, Average Aligned Length:{" "}
        <b>
          {" "}
          {avgAlignedLength.toFixed(2)} ({avgAlignedPct.toFixed(2)} %){" "}
        </b>
        , Mismatched Percenage: <b> {mismatchedPct.toFixed(2)} % </b> <br />
        Total Aligned bps: <b> {cs.total_aligned_length} </b>, Coverage:{" "}
        <b> {coverage} % </b> <br />
        Distinct Aligned bps: <b> {cs.distinct_covered_length} </b>, Distinct
        Coverage: <b>{distinctCoverage} %</b>
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
          <a
            onClick={withAnalytics(
              this.renderMoreReads,
              "AccessionViz_more-reads-link_clicked",
              {
                reads: this.state.reads.length,
                allReads: this.allReads.length,
              },
            )}
            style={{ cursor: "pointer" }}
          >
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
        , <b> {this.props.reads_count} </b> aligned reads <br />
        {coverageSummary}
        {coverageTable}
        <h5>Reads</h5>
        {this.state.reads.map(function(read, i) {
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

AccessionViz.propTypes = {
  accession: PropTypes.string,
  coverageSummary: PropTypes.object,
  name: PropTypes.string,
  reads: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.number),
        PropTypes.arrayOf(PropTypes.string),
      ]),
    ),
  ),
  readsPerPage: PropTypes.number,
  ref_link: PropTypes.string,
  ref_seq: PropTypes.string,
  ref_seq_len: PropTypes.number,
  reads_count: PropTypes.number,
};

export default AccessionViz;
