class Home extends React.Component {


  componentDidMount() {
    console.log(this.props, this.props.pipelineOutputs, 'allofem');
  }

  render() {
    return (
      <div>
        <PipelineList {...this.props}/>

      </div>
    )
  }
}

Home.propTypes = {
  samples: React.PropTypes.array,
  outputData: React.PropTypes.array,
  project: React.PropTypes.any,
};
