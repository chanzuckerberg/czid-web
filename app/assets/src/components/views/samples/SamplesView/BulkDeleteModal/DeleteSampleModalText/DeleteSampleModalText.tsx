import { List, ListItem } from "czifui";
import React from "react";
import cs from "./delete_sample_modal_text.scss";

const DeleteSampleModalText = () => (
  <div>
    <div>
      Deleting your runs will permanently remove the following from CZ ID for
      <span className={cs.semibold}> you and any collaborators </span>
      with access:
    </div>
    <List className={cs.list}>
      <ListItem>The raw data, metadata, and results.</ListItem>
      <ListItem>Any bulk download files that contain the deleted run.</ListItem>
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
