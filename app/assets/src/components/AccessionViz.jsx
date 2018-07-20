import React from "react";
import ReadViz from "./ReadViz";

class AccessionViz extends React.Component {
  constructor(props) {
    super();
    this.allReads = props.reads;
    this.readsPerPage = props.readsPerPage;
    this.coverageSummary = props.coverage_summary || {};
    this.renderMoreReads = this.renderMoreReads.bind(this);
    this.state = {
      reads: this.allReads.slice(0, this.readsPerPage),
      rendering: false
    };
  }

  componentWillUpdate(nextProps, nextState) {
    this.state.rendering = true;
  }

  componentDidUpdate(prevProps, prevState) {
    this.state.rendering = false;
  }
  renderMoreReads() {
    const numReads = this.state.reads.length;
    let nextPageReads = this.allReads.slice(
      numReads,
      numReads + this.readsPerPage
    );
    this.setState(prevState => ({
      reads: [...prevState.reads, ...nextPageReads]
    }));
  }

  render_coverage_table(coverageTable) {
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

  render_coverage_summary(cs) {
    let read_length = cs.total_read_length / cs.num_reads;
    let avg_aligned_length = cs.total_aligned_length / cs.num_reads;
    let avg_aligned_pct = avg_aligned_length / read_length * 100;
    let mismatched_pct =
      cs.total_mismatched_length / cs.total_aligned_length * 100;
    let coverage = cs.total_aligned_length / cs.ref_seq_len * 100;
    let distinct_coverage = cs.distinct_covered_length / cs.ref_seq_len * 100;
    return (
      <div>
        Read Length: <b> {read_length} </b>, Average Aligned Length:{" "}
        <b>
          {" "}
          {avg_aligned_length.toFixed(2)} ({avg_aligned_pct.toFixed(2)} %){" "}
        </b>, Mismatched Percenage: <b> {mismatched_pct.toFixed(2)} % </b>{" "}
        <br />
        Total Aligned bps: <b> {cs.total_aligned_length} </b>, Coverage:{" "}
        <b> {coverage} % </b> <br />
        Distinct Aligned bps: <b> {cs.distinct_covered_length} </b>, Distinct
        Coverage: <b>{distinct_coverage} %</b>
      </div>
    );
  }

  render() {
    const coverage_table = this.coverageSummary.coverage
      ? this.render_coverage_table(this.coverageSummary.coverage)
      : null;
    const coverage_summary = this.coverageSummary.total_read_length
      ? this.render_coverage_summary(this.coverageSummary)
      : null;
    const render_more_link =
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
        </b>, <b> {this.props.reads_count} </b> aligned reads <br />
        {coverage_summary}
        {coverage_table}
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
        {render_more_link}
        <hr />
      </div>
    );
  }
}

export default AccessionViz;
