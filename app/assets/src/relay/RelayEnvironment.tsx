import * as React from "react";
import { useMemo } from "react";
import { RelayEnvironmentProvider } from "react-relay";
import { useAllowedFeatures } from "~/components/common/UserContext";
import { SHOULD_READ_FROM_NEXTGEN } from "~/components/utils/features";
import { createEnvironment } from "./environment";

export default function RelayEnvironment({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const environment = useMemo(() => {
    const allowedFeatures = useAllowedFeatures();
    const shouldReadFromNextGen = allowedFeatures.includes(
      SHOULD_READ_FROM_NEXTGEN,
    );
    return createEnvironment(shouldReadFromNextGen);
  }, []);

  return (
    <RelayEnvironmentProvider environment={environment}>
      {children}
    </RelayEnvironmentProvider>
  );
}
