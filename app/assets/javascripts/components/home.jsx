class Home extends React.Component {
  render() {
    return (
      <div>
        <Samples {...this.props}/>
      </div>
    )
  }
}

Home.propTypes = {
  samples: React.PropTypes.array,
  outputData: React.PropTypes.array,
  project: React.PropTypes.any,
};
