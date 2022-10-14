import { chromium, FullConfig } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

async function globalSetup(config: FullConfig): Promise<void> {
  //todo: implement global login here
}
export default globalSetup;
