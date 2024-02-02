import type { FetchFunction, IEnvironment } from "relay-runtime";
import { Environment, Network, RecordSource, Store } from "relay-runtime";
import { getValidIdentity } from "./identify";

const generateFetchFn = (shouldReadFromNextGen: boolean): FetchFunction => {
  return async (params, variables) => {
    await getValidIdentity();
    const response = fetch("/graphqlfed", {
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

    return response.then(data => data.json());
  };
};

export function createEnvironment(
  shouldReadFromNextGen: boolean,
): IEnvironment {
  const network = Network.create(generateFetchFn(shouldReadFromNextGen));
  const store = new Store(new RecordSource());
  return new Environment({ store, network });
}
