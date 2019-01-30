import React from "react";
import { Slide, ToastContainer as BaseToastContainer } from "react-toastify";
import cs from "./toast_container.scss";
import "react-toastify/dist/ReactToastify.css";

const ToastContainer = () => {
  return (
    <BaseToastContainer
      className={cs.toastContainer}
      position="top-right"
      autoClose={false}
      transition={Slide}
    />
  );
};

export default ToastContainer;
