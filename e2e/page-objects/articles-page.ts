import { expect } from "@playwright/test";
import { PageObject } from "./page-object"

import {
  ANNOTATION_FILTERS,
  COLUMNS_LABEL,
  COLUMN_HEADER_PROP,
  KLEBSIELLA,
  KLEBSIELLA_GENUS,
  LEARN_MORE_LINK,
  READ_SPECIFICITY_FILTERS,
  THRESHOLD_FILTERS,
  THRESHOLD_COMPARISON_OPERATORS,
  NAME_TYPES,
} from "../../constants/sample";

export class ArticlesPage extends PageObject {

  public async validateUrlIncludesLinkText(linkText: string) {
      expect(this.page.url().includes(linkText)).toBeTruthy();
  }
}