import { toast } from "react-toastify";

export const showToast = (component, params = {}) => {
  toast(component, {
    closeButton: false,
    closeOnClick: false,
    draggable: false,
    hideProgressBar: true,
    ...params
  });
};
