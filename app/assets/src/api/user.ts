import { gql, useMutation } from "@apollo/client";
import { isNull } from "lodash";
import { postWithCSRF, putWithCSRF } from "./core";

const CREATE_USER = gql`
  # Creates a new user

  mutation CreateUser(
    $name: String
    $email: String!
    $institution: String
    $role: Int
    $sendActivation: Boolean
    $archetypes: String
    $segments: String
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
      email
    }
  }
`;

const useCreateUser = () => {
  const [create, { loading, error }] = useMutation(CREATE_USER);

  if (loading) return "Submitting...";
  if (error) return `Submission error! ${error.message}`;

  return create;
};

interface userUpdateData {
  name: string;
  role?: number;
  email?: string;
  institution?: string;
  archetypes?: string;
  segments?: string;
  user_profile_form_version?: number;
}

const updateUser = ({
  userId,
  name,
  email,
  institution,
  isAdmin,
  archetypes,
  segments,
  userProfileFormVersion,
}: {
  userId: number;
  name: string;
  email?: string;
  isAdmin?: boolean;
  institution?: string;
  archetypes?: string;
  segments?: string;
  userProfileFormVersion?: number;
}) => {
  const userUpdateData: userUpdateData = {
    name: name,
    email: email,
  };

  // TODO (phoenix) update this once we make role optional on backend,
  // additionally i'm not sure if this logic is correct if we want to update the role of a user, punting to later!
  if (!isNull(isAdmin)) {
    userUpdateData.role = isAdmin ? 1 : 0;
  }

  // TODO (phoenix): email is required on backend, but should not be, stubbing this out for now
  if (!isNull(email)) {
    userUpdateData.email = email;
  }
  if (!isNull(institution)) {
    userUpdateData.institution = institution;
  }

  if (!isNull(archetypes)) {
    userUpdateData.archetypes = archetypes;
  }

  if (!isNull(segments)) {
    userUpdateData.segments = segments;
  }

  if (!isNull(userProfileFormVersion)) {
    userUpdateData.user_profile_form_version = userProfileFormVersion;
  }
  return putWithCSRF(`/users/${userId}.json`, {
    user: userUpdateData,
  });
};

const requestPasswordReset = (email: $TSFixMe) => {
  return postWithCSRF("/auth0/request_password_reset", {
    user: { email },
  });
};

export { useCreateUser, updateUser, requestPasswordReset };
