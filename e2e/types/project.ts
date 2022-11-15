export type Project = {
  id: number;
  name: string;
  description: string;
  created_at: string;
  public_access: number;
  hosts: Array<string>;
  locations: Array<string>;
  editable: boolean;
  users: [
    {
      name: string;
      email: string;
    },
  ];
  creator: string;
  creator_id: number;
  owner: string;
  tissues: Array<string>;
  sample_counts: {
    number_of_samples: number;
    mngs_runs_count: number;
    cg_runs_count: number;
  };
};
