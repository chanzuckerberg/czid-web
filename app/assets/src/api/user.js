import { gql, useMutation } from "@apollo/client";
import { postWithCSRF, putWithCSRF } from "./core";

const CREATE_USER = gql`
  # Creates a new user

  mutation CreateUser(
    $name: String!
    $email: String!
    $institution: String!
    $role: Int!
    $sendActivation: Boolean!
    $archetypes: String!
    $segments: String!
  ) {
    createUser(
      name: $name
      email: $email
      institution: $institution
      role: $role
      sendActivation: $sendActivation
      archetypes: $archetypes
      segments: $segments
    ) {
      name
      email
      institution
      role
      archetypes
      segments
    }
  }
`;

const useCreateUser = () => {
  const [create, { loading, error }] = useMutation(CREATE_USER);

  if (loading) return "Submitting...";
  if (error) return `Submission error! ${error.message}`;

  return create;
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

export { useCreateUser, updateUser, requestPasswordReset };
