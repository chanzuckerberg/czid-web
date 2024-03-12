import { PageObject } from "./page-object";

const SAMPLE_NAMES = "[id*='sequence-label_']";

export class NextcladePage extends PageObject {

  // #region Api
  // #endregion Api

  // #region Click
  // #endregion Click

  // #region Hover
  // #endregion Hover

  // #region Get
  public async getSampleNames() {
    await this.page.locator(SAMPLE_NAMES).first();
    return this.page.locator(SAMPLE_NAMES).allTextContents();
  }

  // #endregion Get

  // #region Macro
  // #endregion Macro

  // #region Validation
  // #endregion Validation

  // #region Bool
  // #endregion Bool
}