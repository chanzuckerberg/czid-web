export const getByTestID = (id: string): string => `[data-testid="${id}"]`;
export const getByText = (text: string): string => `text="${text}"`;
export const getByCss = (className: string): string => `css=${className}`;
export const getByClassName = (className: string): string =>
  `[class="${className}"]`;
export const getByID = (id: string): string => `[id="${id}"]`;
export const getByType = (type: string): string => `input[type="${type}"]`;
export const getByName = (name: string): string => `[name="${name}"]`;
export const getCheckBox = (): string => `'input[type="checkbox"]'`;
export const getByPlaceholder = (placeholder: string): string =>
  `[placeholder="${placeholder}"]`;
export const getByDataName = (name: string): string => `[data-name="${name}"]`;
export const getHasText = (type: string, text: string): string =>
  `${type}has-text("${text}")`;
export const getByTypeAndName = (type: string, name: string): string =>
  `${type}[name="${name}"])`;
export const getByRole = (role: string): string => `[role="${role}"]`;
export const getMetadataField = (name: string): string =>
  `[class="data-table__data column-${name}"]`;

export const getByLinkText = (text: string) => `a:has-text("${text}")`;
