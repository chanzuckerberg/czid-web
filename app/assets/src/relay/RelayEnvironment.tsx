import * as React from "react";
import { useMemo } from "react";
import { RelayEnvironmentProvider } from "react-relay";
import { createEnvironment } from "./environment";

export default function RelayEnvironment({
  children,
  shouldReadFromNextGen,
}: {
  children: React.ReactNode;
  shouldReadFromNextGen: boolean;
}): React.ReactElement {
  const environment = useMemo(() => {
    return createEnvironment(shouldReadFromNextGen);
  }, [shouldReadFromNextGen]);

  return (
    <RelayEnvironmentProvider environment={environment}>
      {children}
    </RelayEnvironmentProvider>
  );
}
