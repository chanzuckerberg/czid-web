export type SampleLocation = {
  id: number;
  name: string;
  geo_level: string;
  country_name: string;
  state_name: string;
  subdivision_name: string;
  city_name: string;
  lat: string;
  lng: string;
  country_id: number;
  state_id: number;
  subdivision_id: string | undefined;
  city_id: string | undefined;
  sample_ids: Array<number>;
  project_ids: Array<number>;
};
