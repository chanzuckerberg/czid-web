---
to: <%= path %>/<%= Name %>/index.tsx
---
import { <%= Name %> } from "./<%= Name %>";
export { <%= Name %> };

/*
 NOTE: component code should go in <%= Name %>.tsx
 This index file is here so our imports are cleaner.
 This way we can use
 import { <%= Name %> } from .../<%= Name %>
 rather than
 import { <%= Name %> } from .../<%= Name %>/<%= Name %>.tsx
*/