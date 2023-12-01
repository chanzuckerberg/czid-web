import type { FetchFunction, IEnvironment } from "relay-runtime";
import {
  Environment,
  Network,
  Observable,
  RecordSource,
  Store,
} from "relay-runtime";

const fetchFn: FetchFunction = (params, variables) => {
  const response = fetch("/graphqlfed", {
    method: "POST",
    headers: [
      ["Content-Type", "application/json"],
      ["x-graphql-yoga-csrf", "graphql-yoga-csrf-prevention"],
    ],
    body: JSON.stringify({
      query: params.text,
      variables,
    }),
  });

  return Observable.from(response.then(data => data.json()));
};

export function createEnvironment(): IEnvironment {
  const network = Network.create(fetchFn);
  const store = new Store(new RecordSource());
  return new Environment({ store, network });
}
