import React from "react";

import Dropdown from "~/components/ui/controls/dropdowns/Dropdown";
import SectionsDropdown from "~/components/ui/controls/dropdowns/SectionsDropdown";
import SubtextDropdown from "~/components/ui/controls/dropdowns/SubtextDropdown";
import { storiesOf } from "@storybook/react";
import {
  DEFAULT_MEDAKA_MODEL_OPTION,
  MEDAKA_MODEL_OPTIONS,
} from "~/components/views/SampleUploadFlow/constants";
import cs from "./Dropdowns.stories.scss";

const DefaultDropdown = () => {
  const [selectedValue, setSelectedValue] = React.useState(
    DEFAULT_MEDAKA_MODEL_OPTION
  );

  const handleSelectionChange = value => setSelectedValue(value);

  return (
    <Dropdown
      arrowInsideTrigger={false}
      className={cs.dropdown}
      fluid
      label="Option"
      onChange={val => handleSelectionChange(val)}
      options={MEDAKA_MODEL_OPTIONS.MINION_GRIDION.options}
      rounded
      value={selectedValue}
    />
  );
};

const Sections = () => {
  const [selectedValue, setSelectedValue] = React.useState(
    DEFAULT_MEDAKA_MODEL_OPTION
  );

  const handleSelectionChange = value => setSelectedValue(value);

  return (
    <SectionsDropdown
      className={cs.dropdown}
      fluid
      categories={MEDAKA_MODEL_OPTIONS}
      onChange={val => handleSelectionChange(val)}
      selectedValue={selectedValue}
    />
  );
};

const Subtext = () => {
  const [selectedValue, setSelectedValue] = React.useState(
    DEFAULT_MEDAKA_MODEL_OPTION
  );

  const handleSelectionChange = value => setSelectedValue(value);

  return (
    <SubtextDropdown
      className={cs.dropdown}
      options={MEDAKA_MODEL_OPTIONS.MINION_GRIDION.options}
      onChange={val => handleSelectionChange(val)}
      selectedValue={selectedValue}
    />
  );
};

storiesOf("Dropdown", module).add("default", () => <DefaultDropdown />);

storiesOf("Dropdown", module).add("sections", () => <Sections />);

storiesOf("Dropdown", module).add("subtext", () => <Subtext />);
