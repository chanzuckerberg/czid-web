---
to: <%= path %>/<%= name %>/index.tsx
---
import { <%= name %> } from "./<%= name %>";
export { <%= name %> };

/*
 NOTE: component code should go in <%= name %>.tsx
 This index file is here so our imports are cleaner.
 This way we can use
 import { <%= name %> } from .../<%= name %>
 rather than
 import { <%= name %> } from .../<%= name %>/<%= name %>.tsx
*/