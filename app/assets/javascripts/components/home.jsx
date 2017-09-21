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
  pipelineOutputs: React.PropTypes.array,
};
