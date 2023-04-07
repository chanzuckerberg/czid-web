import _fp, {
  compact,
  filter,
  first,
  get,
  groupBy,
  partition,
  set,
  sortBy,
} from "lodash/fp";
import React from "react";
import { getOfficialMetadataFields } from "~/api/metadata";
import NarrowContainer from "~/components/layout/NarrowContainer";
import DataTable from "~/components/visualizations/table/DataTable";
import { Dropdown } from "~ui/controls/dropdowns";
import { getAllHostGenomesPublic } from "../../../api";
import { getGroupIndex } from "./constants";
import cs from "./metadata_dictionary.scss";

// @ts-expect-error Property 'convert' does not exist on type 'LodashMap'.ts(2339)
const map = _fp.map.convert({ cap: false });

const dictionaryHeaders = {
  name: "Name",
  description: "Description",
  examples: "Examples",
};

const getExamplesForHostGenome = (field, hostGenomeId) =>
  compact(get(hostGenomeId, field.examples) || get("all", field.examples)).join(
    ", ",
  ) || "--";

class MetadataDictionary extends React.Component {
  state = {
    officialFields: null,
    hostGenomes: null,
    currentHostGenome: null,
  };

  async componentDidMount() {
    let [officialFields, hostGenomes] = await Promise.all([
      getOfficialMetadataFields(),
      getAllHostGenomesPublic(),
    ]);

    officialFields = map(
      field =>
        set("options", field.options ? field.options.join(", ") : "", field),
      officialFields,
    );

    hostGenomes = hostGenomes.filter(hg => hg.showAsOption);

    this.setState({
      officialFields,
      hostGenomes,
      currentHostGenome: get("id", first(hostGenomes)),
    });
  }

  processFields = fields => {
    const processedFields = map(
      field =>
        set(
          "examples",
          getExamplesForHostGenome(field, this.state.currentHostGenome),
          field,
        ),
      fields,
    );

    // Move required fields to the front, and alphabetically sort both sets.
    const [requiredFields, nonrequiredFields] = partition(
      "is_required",
      processedFields,
    );

    return [
      ...map(
        field =>
          set("name", <div className={cs.required}>{field.name}*</div>, field),
        sortBy("name", requiredFields),
      ),
      ...sortBy("name", nonrequiredFields),
    ];
  };

  // Get the field groups for the current host genome. Sort by pre-defined order in constants.
  getFieldGroups = () => {
    if (!this.state.officialFields) return null;

    const fieldsForHostGenome = filter(
      field => field.host_genome_ids.includes(this.state.currentHostGenome),
      this.state.officialFields,
    );

    const groups = map(
      (fields, name) => ({
        name,
        fields: this.processFields(fields),
      }),
      groupBy("group", fieldsForHostGenome),
    );

    return sortBy(group => getGroupIndex(group.name), groups);
  };

  handleHostGenomeChange = id => {
    this.setState({
      currentHostGenome: id,
    });
  };

  getHostGenomeOptions = () =>
    sortBy(
      "text",
      this.state.hostGenomes.map(hostGenome => ({
        text: hostGenome.name,
        value: hostGenome.id,
      })),
    );

  getColumnWidth = column => (column === "name" ? 250 : "");

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
              label="Host Organism"
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
                  getColumnWidth={this.getColumnWidth}
                />
              </div>
            ),
            fieldGroupsToDisplay,
          )}
      </NarrowContainer>
    );
  }
}

export default MetadataDictionary;
