import { Button, DropdownMenu } from "@czi-sds/components";
import React from "react";
import cs from "./pin_sample_selector.scss";

interface PinSampleSelectorProps {
  onApply: () => void;
  onCancel: () => void;
  onClose: () => void;
  onSelectionChange: (
    event: React.SyntheticEvent<Element, Event>,
    value: (
      | string
      | {
          id: number;
          name: string;
          pinned: boolean;
        }
    )[],
  ) => void;
  options: { id: number; name: string; pinned: boolean }[];
  selectedSamples: number[];
  selectSampleTrigger: HTMLElement;
}

const PinSampleSelector = ({
  selectSampleTrigger,
  options,
  onSelectionChange,
  onApply,
  onCancel,
  onClose,
  selectedSamples,
}: PinSampleSelectorProps) => {
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
      // @ts-expect-error Property 'id' does not exist on type 'DefaultDropdownMenuOption'
      isOptionEqualToValue={(option, value) => option.id === value}
      PopperBaseProps={{ placement: "bottom-end", sx: { width: 300 } }}
      search
      title="Select Samples to Pin"
      // @ts-expect-error Type 'number' is not assignable to type 'string | DefaultDropdownMenuOption'.
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

export default PinSampleSelector;
