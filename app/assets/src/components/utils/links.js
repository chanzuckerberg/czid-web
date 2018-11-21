const openUrl = (link, currentEvent) => {
  // currentEvent is optional and it is used to consider
  // modifiers like CMD and CTRL key to open urls in new tabs
  let openInNewTab = false;

  // metakey is CMD in mac
  if (currentEvent && (currentEvent.metaKey || currentEvent.ctrlKey)) {
    openInNewTab = true;
  }

  if (openInNewTab) {
    window.open(link, "_blank", "noopener", "noreferrer");
  } else {
    location.href = link;
  }
};

export { openUrl };
