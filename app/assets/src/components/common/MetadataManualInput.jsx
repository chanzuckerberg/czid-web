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
  isEmpty,
  pickBy,
  has,
  orderBy,
  merge,
  keys,
} from "lodash/fp";

import { logAnalyticsEvent } from "~/api/analytics";
import MultipleDropdown from "~ui/controls/dropdowns/MultipleDropdown";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import DataTable from "~/components/visualizations/table/DataTable";
import PropTypes from "~/components/utils/propTypes";
import PlusIcon from "~ui/icons/PlusIcon";
import { UserContext } from "~/components/common/UserContext";
import HostOrganismSearchBox from "~/components/common/HostOrganismSearchBox";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import { processLocationSelection } from "~/components/ui/controls/GeoSearchInputBox";

import cs from "./metadata_manual_input.scss";
import MetadataInput from "./MetadataInput";

const map = _fp.map.convert({ cap: false });

// From https://czi.quip.com/FPnbATvWSIIL/Metadata-Tooltips#AQKACA1SEBr on 2020-02-18.
// See also descriptions stored in database by MetadataField.
// NOTE: for good layout, text should be no longer than 110 chars.
const COLUMN_HEADER_TOOLTIPS = {
  "Host Organism": "Host from which the sample was originally collected.",
  collection_date:
    "Date on which sample was originally collected. For privacy reasons, only use month and/or year for human data.",
  collection_location_v2:
    "Location from which sample was originally collected. For privacy, we do not allow city-level data for human hosts.",
  nucleotide_type: "Nucleotide type of sample.",
  sample_type:
    "Tissue or site from which the sample was originally collected. Suggested list is dependent on host selection.",
  water_control: "Whether or not sample is a water control.",
  collected_by: "Institution/agency that collected sample.",
  isolate: "Whether or not sample is an isolate.",
  antibiotic_administered: "Antibiotics administered to host.",
  comorbidity: "Other chronic diseases present.",
  host_age: "Age of host (in years).",
  host_genus_species: "Genus or species of host.",
  host_id: "Unique identifier for host.",
  host_race_ethnicity: "Race and-or ethnicity of host.",
  host_sex: "Sex of host.",
  immunocomp: "Information on if host was immunocompromised.",
  primary_diagnosis: "Diagnosed disease that resulted in hospital admission.",
  detection_method:
    "Detection method for the known organism identified by a clinical lab.",
  infection_class: "Class of infection.",
  known_organism: "Organism in sample detected by clinical lab.",
  library_prep: "Information on library prep kit.",
  rna_dna_input: "RNA/DNA input in nanograms.",
  sequencer: "Model of sequencer used.",
  diseases_and_conditions: "Diseases and-or conditions observed in host.",
  blood_fed: "Information about host's blood feeding.",
  gravid: "Whether or not host was gravid.",
  host_life_stage: "Life stage of host.",
  preservation_method: "Preservation method of host.",
  sample_unit: "Number of hosts in sample.",
  trap_type: "Trap type used on host.",
};

// When the auto-populate button is clicked, the following metadata fields will be populated with these values.
const AUTO_POPULATE_FIELDS = {
  "Host Organism": "Human",
  sample_type: "CSF",
  nucleotide_type: "DNA",
  collection_date: "2020-05",
  collection_location_v2: "California, USA",
};

class MetadataManualInput extends React.Component {
  state = {
    selectedFieldNames: [],
    projectMetadataFields: null,
    headers: null,
    metadataFieldsToEdit: {},
    headersToEdit: [],
    hostGenomesByName: {},
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
        hostGenomesByName: keyBy("name", hostGenomes),
        headers: {
          "Sample Name": "Sample Name",
          ...(samplesAreNew ? { "Host Organism": "Host Organism" } : {}),
          ...mapValues("name", keyBy("key", projectMetadataFields)),
        },
      },
      samplesAreNew ? this.setDefaultWaterControl : null
    );
  }

  componentDidUpdate(prevProps) {
    const { samples, samplesAreNew } = this.props;
    // Whenever the samples change, we need to re-sync the metadata with the parent.
    // (e.g. update which samples are included in the metadata object)
    // This is because the validation function checks whether the metadata and samples being uploaded are synced up.
    if (samples !== prevProps.samples) {
      if (samplesAreNew) {
        const isWaterControlSet = this.setDefaultWaterControl();

        // If the water control default was set, the metadata is already synced. No need to do it again.
        if (!isWaterControlSet) {
          this.resyncMetadataWithParent();
        }
      } else {
        this.resyncMetadataWithParent();
      }
    }
  }

  // Need to special case this to avoid a missing required field error.
  // Return whether water control was set.
  setDefaultWaterControl = () => {
    if (has("water_control", this.props.projectMetadataFields)) {
      // Default water_control values to No if they aren't already set.
      this.applyToAll("water_control", "No", false);
      return true;
    }
    return false;
  };

  getManualInputColumns = () => {
    return [
      "Sample Name",
      ...(this.props.samplesAreNew ? ["Host Organism"] : []),
      ...this.state.selectedFieldNames,
    ];
  };

  autoPopulateMetadata = () => {
    const { samples } = this.props;
    const { metadataFieldsToEdit, headersToEdit } = this.state;

    let newMetadataFieldsToEdit = {};

    // For each sample, merge auto-populate fields into existing fields (which may be empty).
    // Existing fields take precedence.
    samples.forEach(sample => {
      newMetadataFieldsToEdit[sample.name] = merge(
        AUTO_POPULATE_FIELDS,
        metadataFieldsToEdit[sample.name] || {}
      );
    });

    const newHeadersToEdit = union(headersToEdit, keys(AUTO_POPULATE_FIELDS));

    this.setState({
      metadataFieldsToEdit: newMetadataFieldsToEdit,
      headersToEdit: newHeadersToEdit,
      applyToAllCell: {
        sampleName: null,
        column: null,
      },
    });

    this.onMetadataChange(newHeadersToEdit, newMetadataFieldsToEdit);
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

  applyToAll = (column, newValue, overrideExistingValue = true) => {
    let newFields = this.state.metadataFieldsToEdit;

    this.props.samples.forEach(curSample => {
      // Only change the metadata value for samples where that field is valid.
      if (
        (this.isHostGenomeIdValidForField(
          this.getSampleHostGenomeId(curSample),
          column
        ) &&
          overrideExistingValue) ||
        get([curSample.name, column], newFields) === undefined
      ) {
        let value = newValue;
        // If the field is location-type, return a less-specific location if necessary.
        if (
          column !== "Host Organism" &&
          this.state.projectMetadataFields[column].dataType === "location"
        ) {
          const isHuman =
            get("taxa_category", this.getSampleHostGenome(curSample)) ===
            "human";
          value = processLocationSelection(newValue, isHuman);
        }

        newFields = set([curSample.name, column], value, newFields);
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
    const { samples, samplesAreNew } = this.props;
    // Only send fields for the selected samples to the parent component.
    // If a sample was added, and then later removed, that sample's metadata will not be sent up,
    // but will still persist in this component.
    // If a sample has no metadata set yet, send an empty object.
    const sampleNames = map("name", samples);
    const sampleMetadataFields = map(
      sampleName => newFields[sampleName] || {},
      sampleNames
    );

    let fieldsForSamples = zipObject(sampleNames, sampleMetadataFields);

    // If we are modifying existing samples, no need to include the samples with empty metadata fields to edit.
    // When modifying new samples, we DO include the empty field objects so the validation error is clearer.
    // (i.e. instead of saying "row missing" for metadata manual input, it will say "host genome missing".)
    if (!samplesAreNew) {
      fieldsForSamples = pickBy(fields => !isEmpty(fields), fieldsForSamples);
    }

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

  // If the samples have changed, we need to re-sync the metadata with the parent
  // (e.g. update which samples are included in the metadata object)
  // even if the user hasn't changed any of the metadata.
  resyncMetadataWithParent = () => {
    const { headersToEdit, metadataFieldsToEdit } = this.state;
    this.onMetadataChange(headersToEdit, metadataFieldsToEdit);
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
      "Host Organism",
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
          this.state.hostGenomesByName[
            this.getMetadataValue(sample, "Host Organism")
          ]
        )
      : sample.host_genome_id;

  getSampleHostGenome = sample =>
    this.state.hostGenomesByName[
      this.getMetadataValue(sample, "Host Organism")
    ];

  isHostGenomeIdValidForField = (hostGenomeId, field) =>
    // Special-case "Host Organism" (the field that lets you change the Host Genome)
    field === "Host Organism" ||
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
          if (this.props.samplesAreNew && column === "Host Organism") {
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
          } else if (
            // Only show a MetadataInput if this metadata field matches the sample's host genome.
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
                  taxaCategory={hostGenome.taxa_category}
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

  getColumnHeaders = columns => {
    return zipObject(
      columns,
      columns.map(column => {
        const label = (this.state.headers || {})[column];
        const content = COLUMN_HEADER_TOOLTIPS[column];
        if (content) {
          const showLink = !["Sample Name", "Host Organism"].includes(column);
          return (
            // Disable the preventOverflow popper.js modifer as it is flipping
            // the tooltip unnecessarily.
            <ColumnHeaderTooltip
              key={label}
              trigger={<span className={cs.label}>{label}</span>}
              title={label}
              content={content}
              link={showLink ? "/metadata/dictionary" : null}
              wide={true}
              popperModifiers={{
                preventOverflow: {
                  enabled: false,
                },
              }}
            />
          );
        }
        return label;
      })
    );
  };

  render() {
    const { admin } = this.context || {};
    const { samplesAreNew } = this.props;
    const columns = this.getManualInputColumns();
    return (
      <div className={cx(cs.metadataManualInput, this.props.className)}>
        <div className={cs.tableContainer}>
          <div className={cs.tableScrollWrapper}>
            <DataTable
              className={cs.inputTable}
              headers={this.getColumnHeaders(columns)}
              columns={columns}
              data={this.getManualInputData()}
              getColumnWidth={this.getColumnWidth}
            />
          </div>
          {this.renderColumnSelector()}
        </div>
        {admin &&
          samplesAreNew && (
            <div
              className={cs.autoPopulateButton}
              onClick={this.autoPopulateMetadata}
            >
              Auto-populate metadata (Admin-only)
            </div>
          )}
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
