import React from "react";
import _fp, {
  filter,
  groupBy,
  set,
  sortBy,
  partition,
  first,
  get,
  union,
  compact
} from "lodash/fp";
import NarrowContainer from "~/components/layout/NarrowContainer";
import DataTable from "~/components/visualizations/table/DataTable";
import { getOfficialMetadataFields } from "~/api";
import { getGroupIndex } from "./constants";
import { Dropdown } from "~ui/controls/dropdowns";
import cs from "./metadata_dictionary.scss";
import { getAllHostGenomes } from "../../../api";

const map = _fp.map.convert({ cap: false });

const dictionaryHeaders = {
  name: "Name",
  description: "Description",
  examples: "Examples"
};

const getExamplesForHostGenome = (field, hostGenomeId) =>
  compact(
    union(get("all", field.examples), get(hostGenomeId, field.examples))
  ).join(", ") || "--";

class MetadataDictionary extends React.Component {
  state = {
    officialFields: null,
    hostGenomes: null,
    currentHostGenome: null
  };

  async componentDidMount() {
    let [officialFields, hostGenomes] = await Promise.all([
      getOfficialMetadataFields(),
      getAllHostGenomes()
    ]);

    officialFields = map(
      field =>
        set("options", field.options ? field.options.join(", ") : "", field),
      officialFields
    );

    this.setState({
      officialFields,
      hostGenomes,
      currentHostGenome: get("id", first(hostGenomes))
    });
  }

  processFields = fields => {
    const processedFields = map(
      field =>
        set(
          "examples",
          getExamplesForHostGenome(field, this.state.currentHostGenome),
          field
        ),
      fields
    );

    // Move required fields to the front, and alphabetically sort both sets.
    const [requiredFields, nonrequiredFields] = partition(
      "is_required",
      processedFields
    );

    return [
      ...map(
        field =>
          set("name", <div className={cs.required}>{field.name}*</div>, field),
        sortBy("name", requiredFields)
      ),
      ...sortBy("name", nonrequiredFields)
    ];
  };

  // Get the field groups for the current host genome. Sort by pre-defined order in constants.
  getFieldGroups = () => {
    if (!this.state.officialFields) return null;

    const fieldsForHostGenome = filter(
      field => field.host_genome_ids.includes(this.state.currentHostGenome),
      this.state.officialFields
    );

    const groups = map(
      (fields, name) => ({
        name,
        fields: this.processFields(fields)
      }),
      groupBy("group", fieldsForHostGenome)
    );

    return sortBy(group => getGroupIndex(group.name), groups);
  };

  handleHostGenomeChange = id => {
    this.setState({
      currentHostGenome: id
    });
  };

  getHostGenomeOptions = () =>
    sortBy(
      "text",
      this.state.hostGenomes.map(hostGenome => ({
        text: hostGenome.name,
        value: hostGenome.id
      }))
    );

  render() {
    const fieldGroupsToDisplay = this.getFieldGroups();
    return (
      <NarrowContainer className={cs.metadataDictionary}>
        <div className={cs.title}>Metadata Dictionary</div>
        {!fieldGroupsToDisplay && <div>Loading...</div>}
        {fieldGroupsToDisplay && (
          <div>
            <div>* = Required</div>
            <Dropdown
              className={cs.hostGenome}
              label="Host Genome:"
              options={this.getHostGenomeOptions()}
              value={this.state.currentHostGenome}
              onChange={this.handleHostGenomeChange}
              rounded
            />
          </div>
        )}
        {fieldGroupsToDisplay &&
          map(
            fieldGroup => (
              <div className={cs.metadataGroup} key={fieldGroup.name}>
                <div className={cs.groupName}>{fieldGroup.name} Fields</div>
                <DataTable
                  data={fieldGroup.fields}
                  headers={dictionaryHeaders}
                  columns={["name", "description", "examples"]}
                />
              </div>
            ),
            fieldGroupsToDisplay
          )}
      </NarrowContainer>
    );
  }
}

export default MetadataDictionary;
