const openUrl = (link, event) => {
  let openInNewTab = false;
  // metakey is CMD in mac
  if (event && (event.metaKey || event.ctrlKey)) {
    openInNewTab = true;
  }
  console.log(event.metaKey, event, openInNewTab);
  if (openInNewTab) {
    window.open(link, "_blank", "noopener", "noreferrer");
  } else {
    location.href = link;
  }
};

export { openUrl };
