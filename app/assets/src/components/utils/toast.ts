import { toast } from "react-toastify";

export const showToast = (
  component: (config: { closeToast: () => void }) => JSX.Element | string,
  params = {},
) => {
  toast(component, {
    closeButton: false,
    closeOnClick: false,
    draggable: false,
    hideProgressBar: true,
    ...params,
  });
};
