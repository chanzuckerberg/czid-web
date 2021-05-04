import { postWithCSRF } from "~/api/core";

export const generateClientDownloadFromEndpoint = async ({
  endpoint,
  params,
  fileName,
  fileType,
}) => {
  const csv = await postWithCSRF(endpoint, params);
  const dataBlob = new Blob([csv], { type: fileType });
  const url = URL.createObjectURL(dataBlob);

  triggerFileDownload({
    downloadUrl: url,
    fileName: fileName,
  });
};

export const triggerFileDownload = ({ downloadUrl, fileName }) => {
  let link = document.createElement("a");
  link.setAttribute("href", downloadUrl);
  link.setAttribute("download", fileName);
  link.setAttribute("visibility", "hidden");
  link.setAttribute("rel", "noopener noreferrer");
  link.setAttribute("target", "_blank");

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
