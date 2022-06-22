import PropTypes from "prop-types";
import React from "react";

function ReadViz({ metrics, name, refInfo, sequence }) {
  const repeatStr = (c, n) => {
    let output = "";
    for (let i = 0; i < n; i += 1) {
      output += c;
    }
    return output;
  };

  const generateQualityString = (refString, seqString) => {
    let misMatches = 0;
    let qualityString = "";
    for (let i = 0; i < seqString.length; i += 1) {
      let cr = refString[i];
      let cs = seqString[i];
      if (cr === "N" || cs === "N" || cr === cs) {
        qualityString += " ";
      } else {
        qualityString += "X";
        misMatches += 1;
      }
    }
    return [qualityString, misMatches];
  };

  const complementSeq = seq => {
    let output = "";
    for (let c of seq) {
      switch (c) {
        case "A":
          output += "T";
          break;
        case "T":
          output += "A";
          break;
        case "C":
          output += "G";
          break;
        case "G":
          output += "C";
          break;
        default:
          output += c;
      }
    }
    return output;
  };

  const parseAlignment = readInfo => {
    const readPart = parseInt(readInfo.name.split("/")[1]) || 1;
    const seqLen = readInfo.sequence.length;
    let sequence = readInfo.sequence;
    let reversed = 0;

    readInfo.metrics[0] = parseFloat(readInfo.metrics[0]);
    for (let i = 1; i <= 7; i += 1) {
      readInfo.metrics[i] = parseInt(readInfo.metrics[i]);
    }
    readInfo.metrics[8] = parseFloat(readInfo.metrics[8]);
    readInfo.metrics[9] = parseFloat(readInfo.metrics[9]);

    if (readInfo.metrics[6] > readInfo.metrics[7]) {
      reversed = 1;
      sequence = sequence
        .split("")
        .reverse()
        .join("");
    }

    if (
      (reversed === 1 && readPart === 1) ||
      (reversed === 0 && readPart === 2)
    ) {
      let m4 = readInfo.metrics[4];
      let m5 = readInfo.metrics[5];
      readInfo.metrics[4] = seqLen - m5 + 1;
      readInfo.metrics[5] = seqLen - m4 + 1;
    }

    let alignedPortion = sequence.slice(
      readInfo.metrics[4] - 1,
      readInfo.metrics[5],
    );
    let leftPortion =
      readInfo.metrics[4] - 2 >= 0
        ? sequence.slice(0, readInfo.metrics[4] - 1)
        : "";
    let rightPortion =
      readInfo.metrics[5] < seqLen ? sequence.slice(readInfo.metrics[5]) : "";

    if (readInfo.refInfo[0].length > leftPortion.length) {
      // trim refInfo[0]
      readInfo.refInfo[0] = readInfo.refInfo[0].slice(
        readInfo.refInfo[0].length - leftPortion.length,
      );
    } else {
      // pad refInfo[0]
      while (readInfo.refInfo[0].length < leftPortion.length) {
        readInfo.refInfo[0] = " " + readInfo.refInfo[0];
      }
    }

    if (readInfo.refInfo[2].length > rightPortion.length) {
      // trim refInfo[2]
      readInfo.refInfo[2] = readInfo.refInfo[2].slice(0, rightPortion.length);
    } else {
      while (readInfo.refInfo[2].length < rightPortion.length) {
        readInfo.refInfo[2] += " ";
      }
    }
    let [qualityString1, misMatches1] = generateQualityString(
      readInfo.refInfo[1],
      alignedPortion,
    );
    let [qualityString2, misMatches2] = generateQualityString(
      readInfo.refInfo[1],
      complementSeq(alignedPortion),
    );
    let qualityString =
      misMatches1 < misMatches2 ? qualityString1 : qualityString2;
    let aligned = misMatches1 < misMatches2 ? alignedPortion : complementSeq(alignedPortion);
    let whiteSpaceLeft = repeatStr(" ", leftPortion.length);
    let whiteSpaceRight = repeatStr(" ", rightPortion.length);
    let refSeqDisplay = readInfo.refInfo.join("|");
    let readSeqDisplay = [leftPortion, aligned, rightPortion].join("|");
    let qualityStringDisplay = [
      whiteSpaceLeft,
      qualityString,
      whiteSpaceRight,
    ].join("|");

    // generate quality string
    return {
      reversed: reversed,
      readPart: readPart,
      refDisplay: refSeqDisplay,
      readDisplay: readSeqDisplay,
      qualityDisplay: qualityStringDisplay,
    };
  };

  const parsedAlignment = parseAlignment({ metrics, name, refInfo, sequence });
  const nopadding = { padding: "0" };

  return (
    <div style={{ border: "1px solid" }}>
      Read Name: {name} <br />
      Percentage Matched: {metrics[0]} %, Alignment Length: {metrics[1]}, #
      Mismatches: {metrics[2]}, # Gap Openings: {metrics[3]} <br />
      E-value: {metrics[8]}, Bit Score: {metrics[9]} <br />
      Reference Alignment Range: {metrics[6]} - {metrics[7]} <br />
      <div
        style={{
          whiteSpace: "pre",
          fontFamily: "monospace",
          overflow: "scroll",
        }}
      >
        <table>
          <tbody>
            <tr>
              <td style={nopadding}>Reference: </td>
              <td style={nopadding}>{parsedAlignment.refDisplay}</td>
            </tr>
            <tr>
              <td style={nopadding}>Read: </td>
              <td style={nopadding}>{parsedAlignment.readDisplay}</td>
            </tr>
            <tr>
              <td style={nopadding}>Mismatches: </td>
              <td style={nopadding}>{parsedAlignment.qualityDisplay}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

ReadViz.propTypes = {
  metrics: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  ),
  name: PropTypes.string,
  refInfo: PropTypes.arrayOf(PropTypes.string),
  sequence: PropTypes.string,
};

export default ReadViz;
