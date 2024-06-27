const openUrl = (
  link: string,
  currentEvent?: { metaKey: boolean; ctrlKey: boolean },
) => {
  // currentEvent is optional and it is used to consider
  // modifiers like CMD and CTRL key to open urls in new tabs
  let openInNewTab = false;

  // metakey is CMD in mac
  if (currentEvent && (currentEvent.metaKey || currentEvent.ctrlKey)) {
    openInNewTab = true;
  }

  if (openInNewTab) {
    openUrlInNewTab(link);
  } else {
    window.open(link, "_self");
  }
};

const openUrlInNewTab = (link: string) => {
  window.open(link, "_blank", "noreferrer");
};

const downloadStringToFile = (str: string) => {
  const file = new Blob([str], { type: "text/plain" });
  const downloadUrl = URL.createObjectURL(file);
  location.href = `${downloadUrl}`;
};

const downloadFileFromCSV = (
  csvJson: readonly (
    | readonly (string | null | undefined)[]
    | null
    | undefined
  )[],
  fileName: string,
) => {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvJson.forEach(function (rowArray) {
    if (!rowArray) return;
    const cleanRowArray = rowArray.map(row => {
      if (!row) return "";
      // remove new lines and commas from the row to avoid csv parsing issues
      let singleLineRow = row.toString().replace(/(\r\n|\n|\r)/gm, "");
      if (singleLineRow.includes(",")) {
        singleLineRow = `"${singleLineRow}"`;
      }
      return singleLineRow;
    });
    const row = cleanRowArray.join(",");
    csvContent += row + "\r\n";
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Opens a new popup window centered to the current window.
const openUrlInPopupWindow = (
  url: string,
  windowName: string,
  windowWidth: number,
  windowHeight: number,
) => {
  const left = window.screenLeft + (window.outerWidth - windowWidth) / 2;
  const top = window.screenTop + (window.outerHeight - windowHeight) / 2;

  return window.open(
    url,
    windowName,
    `left=${left},top=${top},width=${windowWidth},height=${windowHeight},menubar=no,toolbar=no`,
  );
};

const postToUrlWithCSRF = (url: string, params?: Record<string, unknown>) => {
  const form = document.createElement("form");
  form.setAttribute("method", "POST");
  form.setAttribute("action", url);
  const csrf = (<HTMLMetaElement>document.getElementsByName("csrf-token")[0])
    .content;
  params = params || {};
  for (const [key, value] of Object.entries({
    authenticity_token: csrf,
    ...params,
  })) {
    const input = document.createElement("input");
    input.setAttribute("type", "HIDDEN");
    input.setAttribute("name", key);
    input.setAttribute("value", value);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
};

export {
  downloadStringToFile,
  downloadFileFromCSV,
  openUrl,
  openUrlInNewTab,
  openUrlInPopupWindow,
  postToUrlWithCSRF,
};
