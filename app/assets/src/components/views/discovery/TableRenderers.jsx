import React from "react";

import cx from "classnames";
import moment from "moment";

import BasicPopup from "~/components/BasicPopup";
// CSS file must be loaded after any elements you might want to override
import cs from "./table_renderers.scss";

class TableRenderers extends React.Component {
  static renderItemDetails = ({
    cellData: item,
    detailsRenderer,
    nameRenderer,
    visibilityIconRenderer
  }) => {
    let icon = visibilityIconRenderer(item);
    return (
      <div className={cs.item}>
        <div className={cs.visibility}>
          {icon &&
            React.cloneElement(icon, {
              className: `${cx(cs.icon, icon.props.className)}`
            })}
        </div>
        <div className={cs.itemRightPane}>
          <BasicPopup
            trigger={<div className={cs.itemName}>{nameRenderer(item)}</div>}
            content={nameRenderer(item)}
          />
          <div className={cs.itemDescription}>{item.description}</div>
          <div className={cs.itemDetails}>{detailsRenderer(item)}</div>
        </div>
      </div>
    );
  };

  static renderList = ({ cellData: list }) => {
    return list && list.length > 0 ? list.join(", ") : "";
  };

  static renderDate = ({ cellData: date }) => {
    return (
      <div className={cs.date}>
        {date ? moment(date).format("YYYY-MM-DD") : ""}
      </div>
    );
  };

  static renderDateWithElapsed = ({ cellData: date }) => {
    return (
      <div className={cs.dateContainer}>
        {TableRenderers.renderDate({ cellData: date })}
        <div className={cs.elapsed}>{date ? moment(date).fromNow() : ""}</div>
      </div>
    );
  };
}

export default TableRenderers;
