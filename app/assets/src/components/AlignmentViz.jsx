import axios from "axios";
import React from "react";

class ReadViz extends React.Component {
  constructor(props) {
    super();
    this.parsedAlignment = this.parseAlignment(props);
  }

  parseAlignment(readInfo) {
    const readPart = parseInt(readInfo.name.split("/")[1])
    const seqLen = readInfo.sequence.length
    let sequence = readInfo.sequence
    let reversed = 0


    readInfo.metrics[0] = parseFloat(readInfo.metrics[0])
    for (let i = 1; i <= 7; i+=1) {
      readInfo.metrics[i] = parseInt(readInfo.metrics[i])
    }
    readInfo.metrics[8] = parseFloat(readInfo.metrics[8])
    readInfo.metrics[9] = parseFloat(readInfo.metrics[9])

    if (readInfo.metrics[6] > readInfo.metrics[7]) {
      reversed = 1
      sequence = sequence.split("").reverse().join("");
    }

    if ((reversed == 1 && readPart == 1) || (reversed == 0 && readPart == 2)) {
      let m4 = readInfo.metrics[4]
      let m5 = readInfo.metrics[5]
      readInfo.metrics[4] = seqLen - m5 + 1
      readInfo.metrics[5] = seqLen - m4 + 1
    }

    let aligned_portion = sequence.slice(readInfo.metrics[4] - 1, readInfo.metrics[5])
    let left_portion = (readInfo.metrics[4] - 2) >= 0 ? sequence.slice(0, readInfo.metrics[4] - 1) : ""
    let right_portion = readInfo.metrics[5] < seqLen ? sequence.slice(readInfo.metrics[5]) : ""

    if (readInfo.refInfo[0].length > left_portion.length) {
      // trim refInfo[0]
      readInfo.refInfo[0] = readInfo.refInfo[0].slice(readInfo.refInfo[0].length - left_portion.length)
    } else {
      // pad refInfo[0]
      while(readInfo.refInfo[0].length < left_portion.length) {
        readInfo.refInfo[0] = ' ' + readInfo.refInfo[0]
      }
    }

    if (readInfo.refInfo[2].length > right_portion.length) {
      //trim refInfo[2]
      readInfo.refInfo[2] = readInfo.refInfo[2].slice(0, right_portion.length)
    } else {
      while(readInfo.refInfo[2].length < right_portion.length) {
        readInfo.refInfo[2] += ' '
      }
    }
    let [quality_string1, mis_matches1] = this.generateQualityString(readInfo.refInfo[1], aligned_portion)
    let [quality_string2, mis_matches2] = this.generateQualityString(readInfo.refInfo[1], this.complementSeq(aligned_portion))
    let quality_string = mis_matches1 < mis_matches2 ? quality_string1 : quality_string2
    let white_space_left = this.repeatStr(' ', left_portion.length)
    let white_space_right = this.repeatStr(' ', right_portion.length)
    let ref_seq_display = readInfo.refInfo.join("|")
    let read_seq_display = [left_portion, aligned_portion, right_portion].join("|")
    let quality_string_display = [white_space_left, quality_string, white_space_right].join("|")

    // generate quality string
    return {
      reversed: reversed,
      read_part: readPart,
      ref_display: ref_seq_display,
      read_display: read_seq_display,
      quality_display: quality_string_display
    }
  }

  repeatStr(c, n) {
    let output = ''
    for (let i = 0; i < n; i += 1) {
      output += c
    }
    return output
  }

  generateQualityString(refString, seqString) {
    let mis_matches = 0
    let quality_string = ''
    for (let i = 0; i < seqString.length; i += 1) {
      let cr = refString[i]
      let cs = seqString[i]
      if (cr === 'N' || cs === 'N' || cr === cs) {
        quality_string += ' '
      } else {
        quality_string += 'X'
        mis_matches += 1
      }
    }
    return [quality_string, mis_matches]
  }

  complementSeq(seq) {
    let output = ''
    for (let c of seq) {
      switch (c) {
        case 'A':
          output += 'T';
          break;
        case 'T':
          output += 'A';
          break;
        case 'C':
          output += 'G';
          break;
        case 'G':
          output += 'C';
          break;
        default:
          output += c
      }
    }
    return output
  }

  render() {
    const nopadding = {padding: '0'}
    return (
      <div style={{border: '1px solid'}}>
        Read Name: {this.props.name} <br/>
        Percentage Matched: {this.props.metrics[0]} %, Alignment Length: {this.props.metrics[1]}, # Mismatches: {this.props.metrics[2]}, # Gap Openings: {this.props.metrics[3]} <br/>
        E-value: {this.props.metrics[8]}, Bit Score: {this.props.metrics[9]} <br/>
        Reference Alignment Range: {this.props.metrics[6]} - {this.props.metrics[7]} <br/>
       <div style={{whiteSpace: 'pre', fontFamily: 'monospace', overflow: 'scroll'}}>
         <table>
           <tbody>
             <tr><td style={nopadding}>Reference:  </td><td style={nopadding}>{this.parsedAlignment.ref_display}</td></tr>
             <tr><td style={nopadding}>Read:       </td><td style={nopadding}>{this.parsedAlignment.read_display}</td></tr>
             <tr><td style={nopadding}>Mismatches: </td><td style={nopadding}>{this.parsedAlignment.quality_display}</td></tr>
           </tbody>
         </table>
       </div>
      </div>
    );
  }
}

class AccessionViz extends React.Component {
  constructor(props) {
    super(props);
    this.allReads = props.reads
    this.readsPerPage = props.readsPerPage
    this.coverageSummary = props.coverage_summary || {}
    this.state = {
      reads: this.allReads.slice(0, this.readsPerPage)
    }
  }

  render_coverage_table(coverage_table) {
    return  (
      <div>
        <h5> Coverage Details </h5>
        <table style={ {overflowX: 'scroll', border: '1px solid'} }>
        <tbody>
        <tr>
        <td>Read Count</td>
        {
          coverage_table.map((item, i) => {
            return (
              <td key={`count_${i}`}>{item[1]}</td>
            )
          })
        }
        </tr>
        <tr>
        <td>Position Range</td>
        {
          coverage_table.map((item, i) => {
            return (
              <td key={`position_${i}`}>{item[0]}</td>
            )
          })
        }
        </tr>
        </tbody>
        </table>
        <h5>Reads</h5>
        {
          this.state.reads.map(function(read, i) {
            return(
              <ReadViz key={`read_${i}`} name={read[0]} sequence={read[1]} metrics={read[2]} refInfo = {read[3]} />
            )
          })
        }
      </div>
    );
  }

  render_coverage_summary(cs) {
    let read_length = cs.total_read_length / cs.num_reads;
    let avg_aligned_length = cs.total_aligned_length/cs.num_reads
    let avg_aligned_pct = avg_aligned_length/read_length * 100
    let mismatched_pct = cs.total_mismatched_length / cs.total_aligned_length * 100
    let coverage = cs.total_aligned_length / cs.ref_seq_len * 100
    let distinct_coverage = cs.distinct_covered_length / cs.ref_seq_len * 100
    return (
      <div>
        Read Length: <b> { read_length } </b>, Average Aligned Length: <b> {avg_aligned_length.toFixed(2)} ({avg_aligned_pct.toFixed(2)} %) </b>, Mismatched Percenage: <b> {mismatched_pct.toFixed(2)} % </b> <br/>
       Total Aligned bps: <b> {cs.total_aligned_length } </b>, Coverage: <b> {coverage} % </b> <br/>
       Distinct Aligned  bps: <b> {cs.distinct_covered_length} </b>, Distinct Coverage: <b>{distinct_coverage} %</b>
      </div>
    );
  }

  render() {
    let coverage_table = this.coverageSummary.coverage ? this.render_coverage_table(this.coverageSummary.coverage) : null;
    let coverage_summary = this.coverageSummary.total_read_length ? this.render_coverage_summary(this.coverageSummary) : null ;
    return (
      <div style={{overflow: 'scroll'}}>
        <h3> {this.props.accession} : {this.props.name} </h3>
        <b> Reference Sequence:</b> {this.props.ref_seq} <br/>
        <b> Reference Sequence Length: </b> {this.props.ref_seq_len}, <a href={this.props.ref_link}>NCBI URL</a>, <b> {this.props.reads_count} </b> aligned reads <br/>
        { coverage_summary }
        { coverage_table }
      </div>
    );
  }
}

class AlignmentViz extends React.Component {
  constructor(props) {
    super(props);
    this.sampleId = props.sampleId
    this.alignmentQuery = props.alignmentQuery
    this.taxId = props.taxId
    this.taxLevel = props.taxLevel
    this.taxName  = props.taxName
    this.readsPerPage = props.readsPerPage || 20
    this.fetchAlignmentData = this.fetchAlignmentData.bind(this)
    this.state = {
      alignmentData: []
    }
  }

  componentWillMount() {
    this.fetchAlignmentData();
  }

  fetchAlignmentData() {
    axios
      .get(`/samples/${this.sampleId}/alignment_viz/${this.alignmentQuery}.json`)
      .then(res => {
        this.setState({
          alignmentData: res.data
        });
      })
  }

  render() {
    return (
      <div>
      <h2> {this.taxName} ({this.taxLevel}) Alignment ({this.state.alignmentData.length} unique accessions)</h2>
      <div style={ {margin: '15px'} }>
      {
        this.state.alignmentData.map(function(item, i) {
          return (
            <AccessionViz key={`accession_${i}`} readsPerPage={this.readsPerPage} {...item } />
          )
        }, this)
      }
      </div>
      </div>
    );
  }
}

export default AlignmentViz;
