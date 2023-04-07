import React from "react";
import { Slide, ToastContainer as BaseToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import cs from "./toast_container.scss";

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
