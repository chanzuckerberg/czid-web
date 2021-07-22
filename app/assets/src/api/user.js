import { postWithCSRF, putWithCSRF } from "./core";

const createUser = ({
  name,
  email,
  institution,
  isAdmin,
  sendActivation,
  archetypes,
  segments,
}) => {
  return postWithCSRF("/users.json", {
    user: {
      name,
      email,
      institution,
      archetypes,
      segments,
      role: isAdmin ? 1 : 0,
      send_activation: sendActivation,
    },
  });
};

const updateUser = ({
  userId,
  name,
  email,
  institution,
  isAdmin,
  archetypes,
  segments,
}) => {
  return putWithCSRF(`/users/${userId}.json`, {
    user: {
      name,
      email,
      institution,
      archetypes,
      segments,
      role: isAdmin ? 1 : 0,
    },
  });
};

const requestPasswordReset = email => {
  return postWithCSRF("/auth0/request_password_reset", {
    user: { email },
  });
};

export { createUser, updateUser, requestPasswordReset };
