import { ApolloError } from "@apollo/client";
import React from "react";

/**
 * Query Results conditionally renders Apollo useQuery hooks states:
 * loading, error or its children when data is ready
 */
export const QueryResult = ({
  loading,
  loadingType,
  error,
  data,
  children,
}: {
  loading: boolean;
  loadingType?: "none";
  error: ApolloError;
  data: object;
  children: JSX.Element;
}) => {
  if (error) {
    return <p>ERROR: {error.message}</p>;
  }
  if (loadingType === "none" && loading) {
    return null;
  } else if (loading) {
    return <p>Loading...</p>;
  }
  if (!data) {
    return <p>Nothing to show...</p>;
  }
  if (data) {
    return children;
  }
};
