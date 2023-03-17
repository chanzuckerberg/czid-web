import { List, ListItem } from "czifui";
import React from "react";
import { WORKFLOWS, WORKFLOW_VALUES } from "~/components/utils/workflows";
import cs from "./delete_sample_modal_text.scss";

const DeleteSampleModalText = ({ workflow }: { workflow: WORKFLOW_VALUES }) => (
  <div>
    <div>
      Deleting your runs will permanently remove the following from CZ ID for
      <span className={cs.semibold}> you and any collaborators </span>
      with access:
    </div>
    <List className={cs.list}>
      <ListItem>
        The raw data, metadata, and results across all pipeline versions.
      </ListItem>
      <ListItem>
        Any bulk download files that contain the deleted runs.
      </ListItem>
      {/* This bullet point should be removed once amr_v1 feature is out of beta */}
      {workflow === WORKFLOWS.SHORT_READ_MNGS.value && (
        <ListItem>Any associated AMR reports.</ListItem>
      )}
    </List>
    <div>Here is how other artifacts will be affected:</div>
    <List className={cs.list}>
      <ListItem>
        Any saved heatmap or phylotree that contains the deleted runs, including
        saved visualizations, will remain and be re-run without those runs.
      </ListItem>
      <ListItem>
        Sample deletion will not affect existing background models.
      </ListItem>
    </List>
    <span className={cs.semibold}>
      You will not be able to undo this action once completed.
    </span>
  </div>
);

export { DeleteSampleModalText };
