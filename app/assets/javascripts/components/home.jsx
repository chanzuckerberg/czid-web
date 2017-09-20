class Home extends React.Component {
  render() {
    return (
      <div>
        <PipelineList />
      </div>
    )
  }
}

Home.propTypes = {
  samples: React.PropTypes.array,
  outputData: React.PropTypes.array,
  project: React.PropTypes.any,
};
