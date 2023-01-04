# Components
See also existing notes in `DEV_GUIDELINES.md`.

# Notes on React Router

See `DiscoveryViewRouter` as a starting point.

## How to convert a page transition to React Router (backend routing to frontend routing)

- We have two main kinds of page transitions: either a direct link (such as an `href` link to `/resource/1`) or an onClick-style link (such as a call to `openUrl` or `location.href`).
- When these are called, a new page is loaded and the routing is handled on the Rails server, which introduces overhead for the full request cycle and resource processing.
- Frontend routing averts this by intercepting the new page load and changing to a new top-level React component.

### Adding a component to DiscoveryViewRouter

Before converting links, we need to make sure that the component is a child of `DiscoveryViewRouter`. `DiscoveryViewRouter` should be the "top-level" component and show up in the React dev tools Component view. If it's not a child of `DiscoveryViewRouter`, the transition won't work because the render path will never hit the `<Switch>` block.

To move another top-level component under `DiscoveryViewRouter`, you need to replace the call to `react_component` in the `.html.erb` Rails template file. Add any necessary props as props of `DiscoveryViewRouter`, and then make sure those are passed in for that route. See `DiscoveryView` as an example. Ex: `react_component('DiscoveryView', {` turned into `react_component('DiscoveryViewRouter', {`.

Note: There will be some props that you can just get rid of (e.g. `csrf` or `admin` or `allowedFeatures`) since we have different ways of accessing that now.

Add a `<Route>` like this to DiscoveryViewRouter that matches the path:

```jsx
<Route path="/widgets" />
  <WidgetsView />
</Route>
```

Or use `match` to pass in path parameters as props. See also: https://reactrouter.com/web/api/Route

```jsx
<Route
  path="/samples/:id"
  render={({ match }) => <SampleView sampleId={parseInt(match.params.id)} />}
/>
```

After any component conversion, you should verify that you can still load the page by going to the URL directly. Same applies for a page refresh since that is like loading the page in a new tab.

### Converting a direct link

We want to replace the `<a href>` with the React Router `<Link>` component. This component will render an href but prevent the page load. See: https://reactrouter.com/web/api/Link. Both the source and destination components should be children of DiscoveryViewRouter.

Replace

```jsx
<a href={`/phylo_trees/index?treeId=${row.id}`}>View</a>
```

with

```jsx
import { Link as RouterLink } from "react-router-dom";

<RouterLink to={`/phylo_trees/index?treeId=${row.id}`}>View</RouterLink>;
```

We name it `RouterLink` to avoid confusion with our other `Link` component.

### Converting an onClick-style link

You can convert class components or functional compoennts.

#### Class components

Wrap the component with `withRouter` and use the `history` prop that is provided from that. We rename it as `RouterHistory` to avoid confusion with `window.history`.

```jsx
import { withRouter } from "react-router";
...
  handleNavigation = newUrl => {
    const { history: RouterHistory } = this.props;
    RouterHistory.push(newUrl);
  }
...
export default withRouter(MyComponent);
```

#### Functional components

For functional component, use the `useHistory()` hook and `history.push` to set the new location. We rename it as `RouterHistory` to avoid confusion with `window.history`.

```jsx
import { useHistory } from "react-router-dom";

const HomeButton = () => {
  const RouterHistory = useHistory();

  handleClick = () => {
    RouterHistory.push("/home");
  };
  ...
};
```
