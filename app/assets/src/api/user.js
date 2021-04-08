import { postWithCSRF, putWithCSRF } from "./core";

const createUser = ({
  name,
  email,
  institution,
  isAdmin,
  sendActivation,
  archetypes,
  group,
}) => {
  postWithCSRF("/users.json", {
    user: {
      name,
      email,
      institution,
      archetypes,
      group,
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
  group,
}) => {
  putWithCSRF(`/users/${userId}.json`, {
    user: {
      name,
      email,
      institution,
      archetypes,
      group,
      role: isAdmin ? 1 : 0,
    },
  });
};

export { createUser, updateUser };
