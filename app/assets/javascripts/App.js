import React from 'react';
import ReactDOM from 'react-dom';
class App extends React.Component{
  constructor(props, state) {
    super(props, state);
    console.log('props', props, 'state', state);
  }

  version() {
    console.log('v11.5.0');
  }
  render() {
    return (
      <h1>
       Song title: { this.props.song_title }
      </h1>
    );
  }
}

// export(App);
