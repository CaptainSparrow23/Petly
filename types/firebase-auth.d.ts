declare module "firebase/auth" {
  // React Native persistence helper is missing from the published typings.
  export function getReactNativePersistence(storage: any): any;
}
