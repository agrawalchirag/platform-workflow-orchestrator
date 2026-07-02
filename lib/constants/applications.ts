export const APPLICATIONS = [
  "payment-api",
  "user-service",
  "web-frontend",
  "notification-service",
  "analytics-worker",
] as const;

export type ApplicationName = (typeof APPLICATIONS)[number];

export const DEPLOYMENT_VERSIONS = [
  "1.0.0",
  "1.1.0",
  "1.2.0",
  "2.0.0",
  "2.1.0",
] as const;

export type DeploymentVersion = (typeof DEPLOYMENT_VERSIONS)[number];
