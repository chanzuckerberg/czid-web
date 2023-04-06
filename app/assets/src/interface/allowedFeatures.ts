export default interface AllowedFeaturesProps {
  admin: boolean;
  firstSignIn: boolean;
  allowedFeatures: string[];
  appConfig: {
    maxObjectsBulkDownload?: number;
    maxSamplesBulkDownloadOriginalFiles?: number;
  };
  userSettings: {
    example_user_setting?: boolean;
    show_skip_processing_option?: boolean;
  };
  userSignedIn: boolean;
  userId?: number | null;
  profileCompleted: boolean;
}
