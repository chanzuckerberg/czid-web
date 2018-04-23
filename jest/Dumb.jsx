import React from "react";

const Dumb = ({ text1, text2 }) => (
  <div>
    {text1 ? <div>Text 1 is: {text1}</div> : null}
    {text2 ? <div>Text 2 is: {text2}</div> : null}
  </div>
);

export default Dumb;
