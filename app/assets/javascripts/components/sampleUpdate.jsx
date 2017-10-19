class SampleUpdate extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.sample = props.sample ? props.sample : null;
    this.state = {
      name: props.name ? props.name : null,
      hostName: props.host_genome_name ? props.host_genome_name : null,
      hostId: props.host_genome_id ? props.host_genome_id : null,
      // project: 
    }
  }

  componentDidMount() {
    console.log(this.props)
    // this.initializeSelectTag();
    // $(ReactDOM.findDOMNode(this.refs.projectSelect)).on('change',this.handleProjectChange);
    // $(ReactDOM.findDOMNode(this.refs.hostSelect)).on('change',this.handleHostChange);
  }

  render() {
    return (
      <div>
        Edit here
      </div>
    )
  }

}