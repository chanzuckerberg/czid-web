import React from "react";
import cx from "classnames";
import _fp, {
  zipObject,
  filter,
  keyBy,
  mapValues,
  set,
  union,
  get,
  values,
  includes,
  find,
  pickBy,
  has,
  orderBy,
} from "lodash/fp";

import { logAnalyticsEvent } from "~/api/analytics";
import MultipleDropdown from "~ui/controls/dropdowns/MultipleDropdown";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import DataTable from "~/components/visualizations/table/DataTable";
import PropTypes from "~/components/utils/propTypes";
import PlusIcon from "~ui/icons/PlusIcon";
import { UserContext } from "~/components/common/UserContext";
import HostOrganismSearchBox from "~/components/common/HostOrganismSearchBox";

import cs from "./metadata_manual_input.scss";
import MetadataInput from "./MetadataInput";

const map = _fp.map.convert({ cap: false });

class MetadataManualInput extends React.Component {
  state = {
    selectedFieldNames: [],
    projectMetadataFields: null,
    headers: null,
    metadataFieldsToEdit: {},
    headersToEdit: [],
    hostGenomes: [],
    // Which cell the "Apply to All" button should appear on.
    applyToAllCell: {
      sampleName: null,
      column: null,
    },
  };

  componentDidMount() {
    const { projectMetadataFields, hostGenomes, samplesAreNew } = this.props;

    this.setState(
      {
        projectMetadataFields: projectMetadataFields,
        // Default to the required fields.
        selectedFieldNames: map(
          "key",
          filter(["is_required", 1], projectMetadataFields)
        ),
        hostGenomes,
        headers: {
          "Sample Name": "Sample Name",
          ...(samplesAreNew ? { "Host Genome": "Host Genome" } : {}),
          ...mapValues("name", keyBy("key", projectMetadataFields)),
        },
      },
      samplesAreNew ? this.setDefaultWaterControl : null
    );
  }

  // Need to special case this to avoid a missing required field error.
  setDefaultWaterControl = () => {
    if (has("water_control", this.props.projectMetadataFields)) {
      this.applyToAll("water_control", "No");
    }
  };

  getManualInputColumns = () => {
    return [
      "Sample Name",
      ...(this.props.samplesAreNew ? ["Host Genome"] : []),
      ...this.state.selectedFieldNames,
    ];
  };

  // Update metadata field based on user's manual input.
  updateMetadataField = (key, value, sample) => {
    const newHeaders = union([key], this.state.headersToEdit);
    const newFields = set(
      [sample.name, key],
      value,
      this.state.metadataFieldsToEdit
    );
    this.setState({
      metadataFieldsToEdit: newFields,
      headersToEdit: newHeaders,
      applyToAllCell: {
        sampleName: sample.name,
        column: key,
      },
    });

    this.onMetadataChange(newHeaders, newFields);
  };

  applyToAll = (column, newValue) => {
    let newFields = this.state.metadataFieldsToEdit;

    this.props.samples.forEach(curSample => {
      // Only change the metadata value for samples where that field is valid.
      if (
        this.isHostGenomeIdValidForField(
          this.getSampleHostGenomeId(curSample),
          column
        )
      ) {
        newFields = set([curSample.name, column], newValue, newFields);
      }
    });

    const newHeaders = union([column], this.state.headersToEdit);
    this.setState({
      metadataFieldsToEdit: newFields,
      headersToEdit: newHeaders,
      applyToAllCell: {
        sampleName: null,
        column: null,
      },
    });

    this.onMetadataChange(newHeaders, newFields);
  };

  // Convert metadata headers and fields to a CSV-like format before passing to parent.
  onMetadataChange = (newHeaders, newFields) => {
    // Only send fields for the selected samples to the parent component.
    // If a sample was added, and then later removed, that sample's metadata will not be sent up,
    // but will still persist in this component.
    const sampleNames = map("name", this.props.samples);
    const fieldsForSamples = pickBy(
      (fields, sampleName) => includes(sampleName, sampleNames),
      newFields
    );
    this.props.onMetadataChange({
      metadata: {
        headers: ["sample_name", ...newHeaders],
        rows: map(
          (fields, sampleName) => ({
            ...mapValues(value => value || "", fields),
            sample_name: sampleName,
          }),
          fieldsForSamples
        ),
      },
    });
  };

  getMetadataValue = (sample, key) => {
    // Return the manually edited value, or the original value fetched from the server.
    const editedValue = get(
      [sample.name, key],
      this.state.metadataFieldsToEdit
    );

    if (editedValue !== undefined) return editedValue;

    return get(key, sample.metadata);
  };

  handleColumnChange = selectedFieldNames => {
    this.setState({ selectedFieldNames });
    logAnalyticsEvent("MetadataManualInput_column-selector_changed", {
      selectedFieldNames: selectedFieldNames.length,
    });
  };

  getHostGenomeOptions = () =>
    orderBy(
      "count",
      "desc",
      this.props.hostGenomes.map(hostGenome => ({
        text: hostGenome.name,
        value: hostGenome.id,
        count: hostGenome.samples_count,
      }))
    );

  renderColumnSelector = () => {
    const options = values(this.props.projectMetadataFields).map(field => ({
      value: field.key,
      text: field.name,
    }));

    return (
      <MultipleDropdown
        direction="left"
        hideArrow
        hideCounter
        rounded
        search
        checkedOnTop
        menuLabel="Select Columns"
        onChange={this.handleColumnChange}
        options={options}
        trigger={<PlusIcon className={cs.plusIcon} />}
        value={this.state.selectedFieldNames}
        className={cs.columnPicker}
      />
    );
  };

  // Update host genome for a sample.
  updateHostGenome = (hostGenomeIdOrNewName, sample) => {
    const hostGenome = find(
      ["id", hostGenomeIdOrNewName],
      this.props.hostGenomes
    );
    this.updateMetadataField(
      "Host Genome",
      // Convert the id to a name.
      hostGenome ? hostGenome.name : hostGenomeIdOrNewName,
      sample
    );
  };

  renderApplyToAll = (sample, column) => {
    return this.state.applyToAllCell.sampleName === sample.name &&
      this.state.applyToAllCell.column === column ? (
      <div
        className={cs.applyToAll}
        onClick={() => {
          const newValue = this.getMetadataValue(sample, column);
          this.applyToAll(column, newValue);
          logAnalyticsEvent("MetadataManualInput_apply-all_clicked", {
            sampleName: sample.name,
            column,
          });
        }}
      >
        Apply to All
      </div>
    ) : null;
  };

  getSampleHostGenomeId = sample =>
    this.props.samplesAreNew
      ? get(
          "id",
          find(
            ["name", this.getMetadataValue(sample, "Host Genome")],
            this.props.hostGenomes
          )
        )
      : sample.host_genome_id;

  getSampleHostGenome = sample =>
    find(["id", this.getSampleHostGenomeId(sample)], this.state.hostGenomes);

  isHostGenomeIdValidForField = (hostGenomeId, field) =>
    // Special-case 'Host Genome' (the field that lets you change the Host Genome)
    field === "Host Genome" ||
    get([field, "is_required"], this.props.projectMetadataFields) ||
    includes(
      hostGenomeId,
      get([field, "host_genome_ids"], this.props.projectMetadataFields)
    );

  // Create form fields for the table.
  getManualInputData = () => {
    const { allowedFeatures } = this.context || {};

    if (!this.props.samples) {
      return null;
    }
    return this.props.samples.map(sample => {
      const columns = this.getManualInputColumns();

      return zipObject(
        columns,
        // Render the table cell.
        columns.map(column => {
          if (column === "Sample Name") {
            return (
              <div className={cs.sampleName} key="Sample Name">
                {sample.name}
              </div>
            );
          }

          const inputClasses = cx(
            cs.input,
            // Add extra width to location inputs for long names.
            column.startsWith("collection_location") && cs.extraWidth
          );

          const sampleHostGenomeId = this.getSampleHostGenomeId(sample);
          // TODO (gdingle): remove allowedFeatures after launch of sample type, 2020-01-15.
          // See https://jira.czi.team/browse/IDSEQ-2051.
          if (this.props.samplesAreNew && column === "Host Genome") {
            return (
              <div>
                {allowedFeatures.includes("host_genome_free_text") ? (
                  <HostOrganismSearchBox
                    className={inputClasses}
                    value={this.getMetadataValue(sample, column)}
                    onResultSelect={({ result }) => {
                      this.updateHostGenome(result.name || result, sample);
                    }}
                    hostGenomes={this.props.hostGenomes || []}
                  />
                ) : (
                  <Dropdown
                    className={inputClasses}
                    options={this.getHostGenomeOptions()}
                    value={sampleHostGenomeId}
                    onChange={id => this.updateHostGenome(id, sample)}
                    usePortal
                    withinModal={this.props.withinModal}
                  />
                )}
                {this.props.samples.length > 1 &&
                  this.renderApplyToAll(sample, column)}
              </div>
            );
          }
          // Only show a MetadataInput if this metadata field matches the sample's host genome.
          else if (
            this.isHostGenomeIdValidForField(sampleHostGenomeId, column)
          ) {
            // host is unknown on initial load
            const hostGenome = this.getSampleHostGenome(sample) || {};
            return (
              <div>
                <MetadataInput
                  key={column}
                  className={inputClasses}
                  value={this.getMetadataValue(sample, column)}
                  metadataType={this.state.projectMetadataFields[column]}
                  onChange={(key, value) => {
                    this.updateMetadataField(key, value, sample);
                    logAnalyticsEvent("MetadataManualInput_input_changed", {
                      key,
                      value,
                      sampleName: sample.name,
                    });
                  }}
                  withinModal={this.props.withinModal}
                  isHuman={hostGenome.taxa_category === "human"}
                  isInsect={hostGenome.taxa_category === "insect"}
                  sampleTypes={this.props.sampleTypes}
                />
                {this.props.samples.length > 1 &&
                  this.renderApplyToAll(sample, column)}
              </div>
            );
          }
          return (
            <div className={cs.noInput} key={column}>
              {"--"}
            </div>
          );
        })
      );
    });
  };

  getColumnWidth = column => {
    // The width of the input needs to be about 15px smaller than the width of
    // the column to maintain some padding. See also getColumnWidth.
    if (["Sample Name", "collection_location_v2"].includes(column)) {
      return parseInt(cs.metadataInputExtraWidth) + 15;
    } else {
      return parseInt(cs.metadataInputWidth) + 15;
    }
  };

  render() {
    return (
      <div className={cx(cs.metadataManualInput, this.props.className)}>
        <div className={cs.tableContainer}>
          <div className={cs.tableScrollWrapper}>
            <DataTable
              className={cs.inputTable}
              headers={this.state.headers}
              columns={this.getManualInputColumns()}
              data={this.getManualInputData()}
              getColumnWidth={this.getColumnWidth}
            />
          </div>
          {this.renderColumnSelector()}
        </div>
      </div>
    );
  }
}

MetadataManualInput.propTypes = {
  samples: PropTypes.arrayOf(PropTypes.Sample),
  project: PropTypes.Project,
  className: PropTypes.string,
  onMetadataChange: PropTypes.func.isRequired,
  samplesAreNew: PropTypes.bool,
  withinModal: PropTypes.bool,
  projectMetadataFields: PropTypes.object,
  hostGenomes: PropTypes.array,
  sampleTypes: PropTypes.arrayOf(PropTypes.SampleTypeProps).isRequired,
};

MetadataManualInput.contextType = UserContext;

export default MetadataManualInput;
