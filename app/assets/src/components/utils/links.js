const openUrl = (link, currentEvent) => {
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
    location.href = link;
  }
};

const openUrlInNewTab = link => {
  window.open(link, "_blank", "noopener", "noreferrer");
};

const downloadStringToFile = str => {
  let file = new Blob([str], { type: "text/plain" });
  let downloadUrl = URL.createObjectURL(file);
  location.href = `${downloadUrl}`;
};

const openUrlWithTimeout = link => {
  setTimeout(() => {
    openUrl(link);
  }, 2000);
};

export { openUrl, openUrlInNewTab, downloadStringToFile, openUrlWithTimeout };
