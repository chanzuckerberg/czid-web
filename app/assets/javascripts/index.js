import React from 'react';
import ReactDOM from 'react-dom';
const react_component = (c, props) => {
  try {
    const component = (new Function(`return ${c}`))();
  } catch(e){
    console.log('Error occured parsing');
  }

  // console.log('typeof', typeof component);
  // if (typeof component === 'undefined') {
  //   console.log('That component is not defined', component);
  // }
  // ReactDOM.render(
  // React.createElement(component, props, null),
  // document.getElementById('hello'));
};
window.react_component = react_component;
