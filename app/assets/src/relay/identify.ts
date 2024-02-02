import { get } from "~/api/core";

const getIdentityExpiresAt = () =>
  get("/identify").then(data => data.expires_at);

const twoMinutesInSeconds = 2 * 60;

const isIdentityValid = () => {
  const identityExpiresAt = localStorage.getItem("identityExpiresAt");
  if (!identityExpiresAt) {
    return false;
  }
  const expirationTimeUnix = Date.parse(identityExpiresAt);
  const currentTimeUnix = Date.now();

  // Identify is valid if it expires in more than 2 minutes
  return expirationTimeUnix - currentTimeUnix > twoMinutesInSeconds;
};

export const getValidIdentity = async () => {
  if (isIdentityValid()) {
    return;
  }
  const identityExpiresAt = await getIdentityExpiresAt();
  localStorage.setItem("identityExpiresAt", identityExpiresAt);
};
