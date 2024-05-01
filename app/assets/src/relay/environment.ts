import type { FetchFunction, IEnvironment } from "relay-runtime";
import { Environment, Network, RecordSource, Store } from "relay-runtime";
import { logError } from "~/components/utils/logUtil";
import { getValidIdentity } from "./identify";

/**
 * Captures the name of a query/mutation, if it exists.
 *
 * e.g. "DiscoveryViewFCWorkflowRunsQuery" from "query DiscoveryViewFCWorkflowRunsQuery("
 */
const QUERY_NAME_REGEX = /(?:query|mutation)\s+(\S+)\s*\(/;

const generateFetchFn = (shouldReadFromNextGen: boolean): FetchFunction => {
  return async (params, variables) => {
    await getValidIdentity();
    const response = await fetch("/graphqlfed", {
      method: "POST",
      headers: [
        ["Content-Type", "application/json"],
        ["x-graphql-yoga-csrf", "graphql-yoga-csrf-prevention"],
        ["x-should-read-from-nextgen", shouldReadFromNextGen.toString()],
      ],
      body: JSON.stringify({
        query: params.text,
        variables,
      }),
    });

    const responseJson = await response.json();
    if (responseJson.errors != null) {
      logError({
        message: `[GQL Error] ${params.text?.match(QUERY_NAME_REGEX)?.[1]}`,
        details: {
          query: params.text,
          // Stringify because Sentry turns arrays and objects into [Array] and [Object] after a
          // certain depth.
          variables: JSON.stringify(variables),
          errors: JSON.stringify(responseJson.errors),
        },
      });
    }

    return responseJson;
  };
};

export function createEnvironment(
  shouldReadFromNextGen: boolean,
): IEnvironment {
  const network = Network.create(generateFetchFn(shouldReadFromNextGen));
  const store = new Store(new RecordSource());
  return new Environment({ store, network });
}
