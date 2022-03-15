// *** Metadata selector is a component shared between the AMR
// and Taxon heatmaps that displays a dropdown checklist (with search box)
// when a user clicks on the "Add Metadata" button on the Heatmap. ***

import { Button, DropdownPopper, DropdownPaper, MenuSelect } from "czifui";
import PropTypes from "prop-types";
import React from "react";

import cs from "./pin_sample_selector.scss";

const PinSampleSelector = ({
  selectSampleTrigger,
  options,
  onSelectionChange,
  onApply,
  onCancel,
  onClose,
  selectedSamples,
}) => {
  function handleApply() {
    onApply();
    onClose();
  }

  function handleCancel() {
    onCancel();
    onClose();
  }

  function handleClose(_event, reason) {
    if (reason !== "blur") {
      onClose();
    }
  }

  return (
    <DropdownPopper open anchorEl={selectSampleTrigger} placement="bottom-end">
      <div className={cs.title}>Select Samples to Pin</div>
      <MenuSelect
        label="Select Samples to Pin"
        multiple={true}
        getOptionSelected={(option, value) => option.id === value}
        options={options}
        onChange={onSelectionChange}
        onClose={handleClose}
        search={true}
        value={selectedSamples}
        PaperComponent={DropdownPaper}
      />
      <div className={cs.buttonsContainer}>
        <Button
          className={cs.button}
          onClick={handleApply}
          sdsStyle="square"
          sdsType="primary"
        >
          Apply
        </Button>
        <Button
          className={cs.button}
          onClick={handleCancel}
          sdsStyle="square"
          sdsType="secondary"
        >
          Cancel
        </Button>
      </div>
    </DropdownPopper>
  );
};

PinSampleSelector.propTypes = {
  onApply: PropTypes.func,
  onCancel: PropTypes.func,
  onClose: PropTypes.func,
  onSelectionChange: PropTypes.func,
  options: PropTypes.array,
  selectedSamples: PropTypes.array,
  selectSampleTrigger: PropTypes.object,
};

export default PinSampleSelector;
