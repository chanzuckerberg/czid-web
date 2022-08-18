import cx from "classnames";
import { Button, List, ListItem, Tooltip } from "czifui";
import { compact, isEmpty, getOr } from "lodash/fp";
import { nanoid } from "nanoid";
import React, { useState } from "react";

import ExternalLink from "~/components/ui/controls/ExternalLink";
import Modal from "~ui/containers/Modal";
import RadioButton from "~ui/controls/RadioButton";

import cs from "./blast_selection_modal.scss";

import {
  BlastOption,
  BLAST_OPTIONS,
  BlastMethods,
  BlastModalInfo,
} from "./constants";

interface BlastSelectionModalProps {
  open: boolean;
  onContinue: (blastModalInfo: BlastModalInfo) => void;
  onClose: () => void;
  taxonName: string;
  taxonStatsByCountType: {
    ntContigs: number;
    ntReads: number;
    nrContigs: number;
    nrReads: number;
  };
}

const BlastSelectionModal = ({
  open,
  onContinue,
  onClose,
  taxonName,
  taxonStatsByCountType,
}: BlastSelectionModalProps) => {
  const [blastOptionHovered, setBlastOptionHovered] = useState<string | null>(
    null,
  );
  const [blastOptionSelected, setBlastOptionSelected] = useState(null);
  const ntContigs = getOr(0, "ntContigs", taxonStatsByCountType);
  const ntReads = getOr(0, "ntReads", taxonStatsByCountType);
  const nrContigs = getOr(0, "nrContigs", taxonStatsByCountType);
  const nrReads = getOr(0, "nrReads", taxonStatsByCountType);

  const shouldDisableBlastOption = (blastType: string) => {
    switch (blastType) {
      case BlastMethods.BlastN: {
        return ntContigs <= 0 && ntReads <= 0;
      }
      case BlastMethods.BlastX: {
        // BlastX should never be disabled since a taxon will always have a hit in either NT or NR.
        return false;
      }
    }
  };

  const getBlastModalInformation = (): BlastModalInfo => {
    switch (blastOptionSelected) {
      case BlastMethods.BlastN: {
        return {
          selectedBlastType: blastOptionSelected,
          shouldBlastContigs: ntContigs >= 1,
          showCountTypeTabs: false,
        };
      }
      case BlastMethods.BlastX: {
        return {
          selectedBlastType: blastOptionSelected,
          shouldBlastContigs: ntContigs >= 1 || nrContigs >= 1,
          showCountTypeTabs: true,
          availableCountTypeTabsForContigs: compact([
            ntContigs >= 1 && "NT",
            nrContigs >= 1 && "NR",
          ]),
          availableCountTypeTabsForReads: compact([
            ntReads >= 1 && "NT",
            nrReads >= 1 && "NR",
          ]),
        };
      }
    }
  };

  const renderBlastOption = ({
    blastType,
    description,
    learnMoreLink,
    listItems,
    disabledTooltipText,
  }: BlastOption) => {
    const blastOptionIsDisabled = shouldDisableBlastOption(blastType);
    const blastOptionIsSelected = blastOptionSelected === blastType;

    let blastTitle = (
      <div className={cx(cs.title, blastOptionIsDisabled && cs.disabled)}>
        {blastType}
      </div>
    );

    if (blastOptionIsDisabled && blastOptionHovered === blastType) {
      blastTitle = (
        <Tooltip open arrow placement="top" title={disabledTooltipText}>
          {blastTitle}
        </Tooltip>
      );
    }

    const blastLabel = (
      <div
        className={cx(
          cs.selectableOption,
          blastOptionIsSelected && cs.selected,
          blastOptionIsDisabled && cs.disabled,
        )}
        onMouseEnter={() => setBlastOptionHovered(blastType)}
        onMouseLeave={() => setBlastOptionHovered(null)}
        onClick={() =>
          blastOptionIsDisabled ? null : setBlastOptionSelected(blastType)
        }
      >
        <RadioButton
          disabled={blastOptionIsDisabled}
          selected={blastOptionIsSelected}
          className={cx(cs.radioButton, cs.alignTitle)}
        />
        <div className={cs.optionText}>
          {blastTitle}
          <div
            className={cx(cs.description, blastOptionIsDisabled && cs.disabled)}
          >
            {description}
            <ExternalLink
              className={cs.link}
              disabled={blastOptionIsDisabled}
              href={learnMoreLink}
            >
              Learn More
            </ExternalLink>
          </div>
          {blastOptionIsSelected && !isEmpty(listItems) && (
            <List>
              {listItems.map(item => (
                <ListItem fontSize="xs" key={nanoid()}>
                  {item}
                </ListItem>
              ))}
            </List>
          )}
        </div>
      </div>
    );

    return blastLabel;
  };

  return (
    <Modal narrow open={open} tall onClose={onClose} xlCloseIcon>
      <div className={cs.blastSelectionModal}>
        <div className={cs.header}>Select a BLAST Type</div>
        <div className={cs.taxonName}>{taxonName}</div>
        <div className={cs.selectableOptions}>
          {BLAST_OPTIONS.map(option => renderBlastOption(option))}
        </div>
        <div className={cs.actions}>
          <div className={cs.action}>
            <Button
              sdsStyle="rounded"
              sdsType="primary"
              disabled={!blastOptionSelected}
              onClick={() => onContinue(getBlastModalInformation())}
            >
              Continue
            </Button>
          </div>
          <div className={cs.action}>
            <Button sdsStyle="rounded" sdsType="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BlastSelectionModal;
