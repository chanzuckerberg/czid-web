import { Button, DropdownMenu } from "czifui";
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
    if (reason !== "blur" && reason !== "toggleInput") {
      onClose();
    }
  }

  return (
    <DropdownMenu
      anchorEl={selectSampleTrigger}
      disableCloseOnSelect
      multiple
      onChange={onSelectionChange}
      onClose={handleClose}
      open
      options={options}
      isOptionEqualToValue={(option, value) => option.id === value}
      PopperBaseProps={{ placement: "bottom-end", sx: { width: 300 } }}
      search
      title="Select Samples to Pin"
      value={selectedSamples}
    >
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
    </DropdownMenu>
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
