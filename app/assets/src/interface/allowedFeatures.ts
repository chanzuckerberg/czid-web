export default interface AllowedFeaturesProps {
  admin: boolean;
  firstSignIn: boolean;
  allowedFeatures: string[];
  appConfig: object;
  userSettings: object;
  userSignedIn: boolean;
}
