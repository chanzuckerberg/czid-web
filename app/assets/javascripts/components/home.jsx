class Home extends React.Component {

  render() {
    return (
      <div>
        <PipelineList {...this.props}/>

      </div>
    )
  }
}

Home.propTypes = {
  pipelineOutputs: React.PropTypes.array,
};
