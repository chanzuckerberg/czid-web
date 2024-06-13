/**
 * The sole purpose of this file is to expose the local Playwright config to the VS Code Playwright
 * extension for breakpoint debugging.
 *
 * NOTE: You must have /e2e added as a top level directory in the "Explorer" tab and run the tests
 * from /e2e in the "Testing" tab because /e2e has its own package.json.
 */

import config from "./setup/local.config";

export default config;
