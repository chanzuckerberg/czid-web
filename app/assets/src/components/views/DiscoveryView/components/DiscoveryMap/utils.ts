import { indexOf } from "lodash/fp";
import { MAP_LEVEL_ORDER } from "~/components/views/DiscoveryView/components/DiscoveryMap/constants";

export const indexOfMapLevel = (level: string) =>
  indexOf(level, MAP_LEVEL_ORDER);

export const isValidCoordinate = (lat, lng) =>
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
