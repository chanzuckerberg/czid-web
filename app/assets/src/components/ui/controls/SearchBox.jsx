import React from "react";
import { Search } from "semantic-ui-react";
import { escapeRegExp, debounce } from "lodash";

const delayCheckMatch = 1000;
const waitHandleSearchChange = 500;

class SearchBox extends React.Component {
  constructor(props) {
    super(props);

    this.source = this.props.source;

    this.resetComponent = this.resetComponent.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleResultSelect = this.handleResultSelect.bind(this);

    this.blankState = { isLoading: false, results: [], value: "" };

    this.state = this.blankState;
  }

  resetComponent() {
    this.setState(this.blankState);
  }

  handleResultSelect(e, { result }) {
    this.setState({ value: result.title });
    this.props.onResultSelect(e, { result });
  }

  handleSearchChange(e, { value }) {
    this.setState({ isLoading: true, value });

    setTimeout(() => {
      if (this.state.value.length < 1) return this.resetComponent();

      const re = new RegExp(escapeRegExp(this.state.value), "i");
      const isMatch = result => re.test(result.title);
      this.setState({
        isLoading: false,
        results: this.source.filter(isMatch)
      });
    }, delayCheckMatch);
  }

  render() {
    const { isLoading, value, results } = this.state;
    return (
      <Search
        className="idseq-ui input search"
        loading={isLoading}
        onSearchChange={debounce(
          this.handleSearchChange,
          waitHandleSearchChange,
          {
            leading: true
          }
        )}
        results={results}
        value={value}
        onResultSelect={this.handleResultSelect}
      />
    );
  }
}

export default SearchBox;
