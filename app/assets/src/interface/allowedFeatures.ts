export default interface UserContextType {
  admin: boolean;
  firstSignIn: boolean;
  allowedFeatures: string[];
  appConfig: {
    autoAccountCreationEnabled?: boolean;
    maxObjectsBulkDownload?: number;
    maxSamplesBulkDownloadOriginalFiles?: number;
  };
  userSignedIn: boolean;
  userId?: number | null;
  userName?: string | null;
  userEmail?: string | null;
  profileCompleted: boolean;
}
