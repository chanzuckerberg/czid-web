export default interface UserContextType {
  admin: boolean;
  firstSignIn: boolean;
  allowedFeatures: string[];
  appConfig: {
    autoAccountCreationEnabled?: boolean;
    maxObjectsBulkDownload?: number;
    maxSamplesBulkDownloadOriginalFiles?: number;
  };
  userSettings: {
    example_user_setting?: boolean;
    show_skip_processing_option?: boolean;
  };
  userSignedIn: boolean;
  userId?: number | null;
  userName?: string | null;
  userEmail?: string | null;
  profileCompleted: boolean;
}
