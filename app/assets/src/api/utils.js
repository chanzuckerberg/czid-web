const getCsrfToken = () => {
  return document.getElementsByName("csrf-token")[0].content;
};

export { getCsrfToken };
