import React from "react";
import PropTypes from "prop-types";

import { Table } from "~/components/visualizations/table";
import BasicPopup from "~/components/BasicPopup";
import cx from "classnames";
// CSS file must be loaded after any elements you might want to override
import cs from "./base_discovery_view.scss";

class BaseDiscoveryView extends React.Component {
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
    return list && list.length > 0 ? list.join(", ") : "N/A";
  };

  render() {
    const { columns, data, handleRowClick } = this.props;

    return (
      <Table
        sortable
        data={data}
        columns={columns}
        defaultRowHeight={68}
        onRowClick={handleRowClick}
      />
    );
  }
}

BaseDiscoveryView.defaultProps = {
  columns: [],
  data: []
};

BaseDiscoveryView.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.array,
  handleRowClick: PropTypes.func
};

export default BaseDiscoveryView;
