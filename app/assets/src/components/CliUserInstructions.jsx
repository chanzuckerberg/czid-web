import React from "react";
import { Form, TextArea } from "semantic-ui-react";
import PropTypes from "prop-types";

class CliUserInstructions extends React.Component {
  render() {
    const singleUploadCmd = `idseq -e ${this.props.email} -t ${
      this.props.authToken
    } -p 'Your Project Name' -s 'Your Sample Name' --r1 your_sample_R1.fastq.gz --r2 your_sample_R2.fastq.gz --host-genome-name 'Human'`;

    const bulkUploadCmd = `idseq -e ${this.props.email} -t ${
      this.props.authToken
    } -p 'Your Project Name' --bulk . --host-genome-name 'Human'`;

    const genomesList = `'${this.props.hostGenomes.join("', '")}'`;

    return (
      <div className="instruction-container">
        <p className="instruction-heading">
          {
            "(1) Install and configure the Amazon Web Services Command Line Interface (AWS CLI): "
          }
        </p>
        <div>
          For macOS users: We recommend trying the Homebrew package manager to
          install <span className="code">awscli</span>. You can install by
          running these commands:
          <div className="code-bullet">
            /usr/bin/ruby -e "$(curl -fsSL
            https://raw.githubusercontent.com/Homebrew/install/master/install)"
          </div>
          <div className="code-bullet">brew install awscli</div>
        </div>
        <p>
          {`- Otherwise follow the AWS installation instructions `}
          <a
            href="https://docs.aws.amazon.com/cli/latest/userguide/installing.html"
            target="_blank"
            rel="noopener noreferrer"
            className="terms-link"
          >
            here
          </a>
          {`. `}
        </p>
        <p>
          - Verify it works by running <span className="code">aws help</span>,
          which should display usage instructions. You do not need to set up AWS
          credentials unless you're using the bulk upload mode.
        </p>
        <p className="instruction-heading">(2) Install the IDseq CLI:</p>
        <div>
          <span className="code">
            pip install git+https://github.com/chanzuckerberg/idseq-cli.git
            --upgrade
          </span>
          <p className="instruction-medium-margin-top">
            - Tips: Make sure you have Python 2 or 3 installed already. Try
            running <span className="code">pip --version</span> or{" "}
            <span className="code">python --version</span>.
          </p>
          <p>
            - Try running with <span className="code">pip2</span> or{" "}
            <span className="code">pip3</span> depending on your configuration.
            Try <span className="code">sudo pip</span> if you run into
            permissions errors (anything like OSError: [Errno 13] Permission
            denied). You can use this same command in the future to update the
            CLI if needed.
          </p>
        </div>
        <p />
        <p className="instruction-heading">(3) Upload a single sample:</p>
        <div className="code center-code">
          <p>
            idseq -e <span className="code-personal">{this.props.email}</span>{" "}
            -t <span className="code-personal">{this.props.authToken}</span> -p
            {"'"}
            <span className="code-to-edit">Your Project Name</span>
            {"' -s '"}
            <span className="code-to-edit">Your Sample Name</span>
            {"'"} \
            <br /> --r1 <span className="code-to-edit">
              your_sample_R1
            </span>.fastq.gz --r2{" "}
            <span className="code-to-edit">your_sample_R2</span>.fastq.gz
            --host-genome-name <span className="code-to-edit">{"'Human'"}</span>
          </p>
        </div>
        <div className="instruction-medium-margin-top">
          Edit the command in this text box and copy-and-paste:
          <Form className="instruction-medium-margin-top">
            <TextArea
              className="code-personal"
              defaultValue={singleUploadCmd}
              autoHeight
            />
          </Form>
        </div>
        <p className="instruction-medium-margin-top">
          {
            "- Supported file types: .fastq/.fq/.fasta/.fa or .fastq.gz/.fq.gz/.fasta.gz/.fa.gz"
          }
        </p>
        <p>{`- Supported host genome values: ${genomesList}`}</p>
        <p>
          {"- Your authentication token for uploading is: "}
          <span className="code-personal">{this.props.authToken}</span>
          {"  Keep this private like a password!"}
        </p>
        <p>
          {
            '- Tips: Avoid copying commands into programs like TextEdit because it may change "straight quotes" into “smart quotes” (“ ‘ ’ ”) which will not be parsed correctly in your terminal.'
          }
        </p>
        <p>
          {
            "- The '\\' symbol means to continue on the next line in the terminal. If you use this in your command, make sure it is not followed by a space before the line break."
          }
        </p>
        <p>
          - New to using a command line? You will need to use{" "}
          <span className="code">cd</span> and <span className="code">ls</span>{" "}
          to navigate to the folder on your computer containing the source files
          you want to upload.{" "}
          <a
            href="https://courses.cs.washington.edu/courses/cse140/13wi/shell-usage.html"
            target="_blank"
            rel="noopener noreferrer"
            className="terms-link"
          >
            Guide here
          </a>.
        </p>
        <p className="instruction-heading">
          (Optional) Run the program in interactive mode:
        </p>
        <p>
          Having trouble? Just run <span className="code">idseq</span> without
          any parameters and the program will guide you through the process.
        </p>
        <p className="instruction-heading">
          (Optional) Upload samples in bulk mode by specifying a folder:
        </p>
        <div className="code center-code">
          <p>
            idseq -e <span className="code-personal">{this.props.email}</span>{" "}
            -t <span className="code-personal">{this.props.authToken}</span> -p
            {"'"}
            <span className="code-to-edit">Your Project Name</span>
            {"'"} \
            <br /> --bulk{" "}
            <span className="code-to-edit">
              /path/to/your/folder{" "}
            </span>--host-genome-name{" "}
            <span className="code-to-edit">{"'Human'"}</span>
          </p>
        </div>
        <div className="instruction-medium-margin-top">
          Edit the command in this text box and copy-and-paste:
          <Form className="instruction-medium-margin-top">
            <TextArea
              className="code-personal"
              defaultValue={bulkUploadCmd}
              autoHeight
            />
          </Form>
        </div>
        <p className="instruction-medium-margin-top">
          {
            "- The '.' refers to the current folder in your terminal. The program will try to auto-detect files in the folder."
          }
        </p>
        <p className="upload-question">
          For more information on the IDseq CLI, have a look at its{" "}
          <a
            href="https://github.com/chanzuckerberg/idseq-cli"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub repository
          </a>.
        </p>
      </div>
    );
  }
}

CliUserInstructions.propTypes = {
  trigger: PropTypes.node,
  email: PropTypes.string,
  authToken: PropTypes.string,
  hostGenomes: PropTypes.array
};

export default CliUserInstructions;
