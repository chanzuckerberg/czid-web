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
  pipelineOutputs: React.PropTypes.array,
};
