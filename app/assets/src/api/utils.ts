const getCsrfToken = () => {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'content' does not exist on type 'HTMLEle... Remove this comment to see the full error message
  return document.getElementsByName("csrf-token")[0].content;
};

export { getCsrfToken };
