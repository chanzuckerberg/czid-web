const openUrl = link => {
  let openInNewTab = false;

  // metakey is CMD in mac
  if (event && (event.metaKey || event.ctrlKey)) {
    openInNewTab = true;
  }

  if (openInNewTab) {
    window.open(link, "_blank", "noopener", "noreferrer");
  } else {
    location.href = link;
  }
};

export { openUrl };
