import { indexOf } from "lodash/fp";
import { MAP_LEVEL_ORDER } from "~/components/views/discovery/mapping/constants";

export const indexOfMapLevel = level => indexOf(level, MAP_LEVEL_ORDER);
