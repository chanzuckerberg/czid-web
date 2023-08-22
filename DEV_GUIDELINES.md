# IDseq Frontend Development Guidelines (Perpetual WIP) - updated Feb 2023

The goal of this document is to present a set of guidelines, conventions and best practices to develop frontend code for CZID. It is an ongoing effort as opposed to a thorough document.
These guidelines should be enforced for any new PRs.

---

## _Javascript_

When in doubt, follow the [Airbnb JS Style Guide](https://github.com/airbnb/javascript).

The following norms are particularly relevant to `czid-web`.
- Use named exports rather than default exports
  - The reason is because if you use named exports, you can always find all instances of a component's use by searching for that component's name. With default exports, the importing file can rename that component to anything, making it much harder to find where components are used. This matters when modifying code so that future developers can understand the impact changes to a component has throughout the application, or when a developer intends to remove old components.
  - yes: export const SomeComponent…
  - no: const SomeComponent…
          export default SomeComponent
- Use functional components over class components
- Frontend variables should be camelCase and should share their names with the corresponding ruby snake_case variables
- Component imports (lint-rule enforced) Imported components themselves should be alphabetical within each group. For import file order:
  - libs
  - absolute paths
  - relative paths
- Line length maximum 120 characters (lint-rule enforced)
- Type definitions either at the top of the file or in a separate types.ts file in the component’s directory

### Naming

1. **Identifiers (variables, objects and methods)** should be named using `camelCase` notation starting with a **lowercase** letter
2. **Classes and filenames** are named using `CamelCase` notation starting with an **uppercase** letter
3. Use **descriptive names**. Longer descriptive names are preferred to short cryptic ones, e.g. `convertThresholdedFiltersToJson` vs `convThresh` (great if you can be both short and descriptive...)
4. Names for specific purposes:
   1. **Event handlers**: should be prefixed with `handle...` and, e.g. `handleThresholdApplyClick`
   2. **Event hooks**: should be prefixed with `on...` e.g. `onApplyClick`
      1. Example: `<Button onClick={this.handleButtonClick} />`
      2. `onClick` is a **hook** (kind of like a parameter), which allows a **handler** like `handlerButtonClick` to be supplied by a client.
   3. **Boolean methods**: should be prefixed with a verb `is` or `has`, e.g. `isThresholdValid`

### `lodash/fp`
[`lodash/fp`](https://github.com/lodash/lodash/wiki/FP-Guide) provides nice immutable utility functions (see React section below on immutability). We use `lodash/fp` exclusively (no `lodash`) in order to prevent confusion between the two variants.

When possible, please use native/built-in functions over lodash functions. For example, Array.map is a built in JS function, so you would not need to use the lodash map unless you were working with an object. Native functions tend to be more readable and performant than lodash. Additionally, avoid using `lodash.get`. JS now has [optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining), which enables us to, eg, call functions or access object values only if they exist and continue error free if they do not. Optional chaining is more readable and performant than using loadsh `get`.

## _React Components_

### Component Fractal Directory Structure

The basic way to build a React component is to follow the steps below. We use hygen code generator to set up this boilerplate - see below.

For illustration, we will create a view component named `Foo` in `.../views/Foo`
```
Foo
├──Foo.tsx
├──index.tsx
├──foo.scss
├──components
├──├──Bar
├──├──├──...

```
1. Create a component folder in the directory it belongs to. E.g., a view component lives in `./app/assets/src/components/views/*`.

1. Create a new file `.../views/Foo/Foo.tsx` - this is where the implementation details of `Foo` should live.

1. Create a new file `.../views/Foo/index.tsx` - this file simply imports Foo and exports it. This is how the call sites import the component.

1. Create `./src/views/Foo/foo.scss` to host all styles you use in `.../views/Foo/Foo.tsx`. If your component name has multiple words like `FooComponent` then the scss file will be snake case `foo_component.scss`.

1. Create `.../views/Foo/components/` directory to host all sub-components you use in `.../views/Foo/Foo.tsx`. For example, if you use component `<Bar />` in `<Foo>`, you can create a directory `.../views/Foo/components/Bar` to encapsulate `Bar` component's implementation details.

1. And if `Bar` component uses `Baz`, we can create `.../views/Foo/components/Bar/components/Baz` to encapsulate `Baz` component's implementation details

As you can see, a component is typically made of other components and/or sub-components, so we can use the basic component file structure illustrated above to recursively build out a component at any level. One benefit of this fractal is that the component interface and boundaries are well defined, so extracting a component to a different directory is as easy as cut and paste

#### Using hygen
We have a component template defined with [hygen](https://www.hygen.io/docs/quick-start). Templates live in any `_templates` directory. Feel free to add more templates.

To use
```
$ brew tap jondot/tap
$ brew install hygen
```
To generate a new component skeleton in our project:
1. Copy the path where you want the component to live
1. Run
```
$ hygen component new ComponentName
```
It will prompt you for the path and then create the component skeleton for you.

There is also a vscode extension that will run the generator:
1. Install the hygen extension
1. Open command pallete (Shift+Cmd+P) and search for 'hygen'.
1. Select the new component template
1. Paste in the path when prompted


### Component Design

- One component per file
  - Please avoid using `renderChildComopnent` type functions to create building blocks of code within a component. If you need one, choose to create a new child component instead. When you have multiple components in one file where most are rendered using anonymous functions, the subcomponents are not named independently from the parent, and all the state lives together at the parent level. This removes the ability to efficiently troubleshoot React components using React dev tools.
- Each component gets its own scss file. Style reuse should be limited to avoid bugs when updating or deleting styles.
- Prefer stateless functional components over class-based components for new components. Try `useEffect`, `useState`, and other [React Hooks](https://reactjs.org/docs/hooks-reference.html) if you need lifecycle methods.
- Avoid monolithic components. Break complex components up into smaller units.
  - Each component should have a single use.  
  - If the component has 3 or more variations, it should be split into multiple components
  - This makes code easier to reason about and encourages reusability.
- Components should usually be no more than 250 lines.
- Pull business logic out of the component and into pure utility functions whenever possible. Better readability, and easier to unit-test further down the line. Also keeps the component slim and focused on the core business logic and rendering.
### JSX
- Prefer inline JSX over render functions. This will be difficult to do for existing giant components, but we should lean toward this going forward. If you find yourself making lots of render components, that might be a good sign that you need to break your components into several smaller components.
  - yes:
    ```
      return (
        <>
          <Table />
        </>
      )
    ```
  - no:
    ```
      const renderTable = () => <Table />
      return (
        <>
          {renderTable()}
        </>
      )
    ```
- Use semantic HTML elements (i.e. ul/li for lists, not divs for everything). This is important for accessibility.

### SCSS
- Use camelCase class names
- Use SDS components, mixins, etc whenever possible
- Prefer full class names over nested css
  - yes: 
    ```
    .header {
      @include font-header-xs;
    }

    .headerIcon {
      margin-right: $sds-spaces-xs;
    }
    ```
  - no: 
    ```
    .header {
      @include font-header-xs;
      .icon {
        margin-right: $sds-spaces-xs;
      }
    }
    ```

### Component Naming

- Include the type of the component as a **suffix** of the name. For instance:
  - `PrimaryButton`
  - `SamplesView`
  - `HeatmapVisualization`


### Shared Files

**API calls**
Put API calls in [`/api`](https://github.com/chanzuckerberg/czid-web-private/tree/main/app/assets/src/api). Use and build upon the provided api methods like `postWithCSRF` and `get` instead of directly using `axios`. This layer of indirection allows us to do things like standardized error handling and converting snake case to camel case for all our API endpoints further down the line.

Start putting fetch methods like `fetchSampleMetadata` in `/api`, so that it's easy to see all the back-end endpoints the front-end is using.

The main `index.js` file is quite large, so prefer putting methods in a more specific file in the `/api` folder if possible.

### Accessibility (a11y)

We have some accessibility rules defined in `.eslintrc-a11y.json` (you can run `./node_modules/.bin/eslint app/assets/src -c .eslintrc-a11y.json --ext .js,.jsx`).

#### _Visible, non-interactive elements with click handlers must have at least one keyboard listener_

- Try adding an `onKeyDown` with the same handler as the `onClick`. When the element is focused, this gives non-mouse users a keyboard option.
  - Example: `onClick={this.handleClick} onKeyDown={this.handleClick}`

#### _Static HTML elements with event handlers require a role_
- Use the correct semantic HTML instead!
- You can add an [ARIA role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques), although there may be other warnings resulting from the rule addition.

### Other Best Practices

- **Don't Mutate Objects:** Always create a new object/array when modifying component state, instead of modifying the original object (even if you call `setState` afterward). This allows React to figure out if props have changed by via shallow comparison, and allows for future rendering optimizations using `React.PureComponent`. `lodash/fp` functions are immutable and do this by default.

- **Use Arrow Functions:** Inside React components, define instance methods with arrow function syntax `foo = () => { ... }`. This removes the need for `this.foo = this.foo.bind(this)`.

- **Be Conscious of setState:** Be very careful of the the asynchronous nature of `this.setState`, as it can lead to subtle bugs. The `prevState` version (`this.setState(prevState => {}`) can work as a quick fix, but overuse of `prevState` and wrapping entire functions in `this.setState` is discouraged. You can often reorganize your functions to remove the bug (and also clarify the different code flows).

### Use hash style with 3 or more parameters to a function.

This makes it easier to add/remove arguments, reason about long lists of arguments, and work with default values. It also improves readability when calling the function.

#### **Avoid**

`const sampleErrorInfo = (sample, pipelineRun = {}, error = {}) => { ...`

#### **Aspire**

`const sampleErrorInfo = ({ sample, pipelineRun = {}, error = {} }) => { ...`

### Avoid triple ternaries

- Single ternaries are encouraged for simple expressions.
- Double ternaries in JSX can be used when appropriate. Please use parantheses.
- Triple ternaries are heavily discouraged.

#### **Avoid**

`filtersLoaded ? Array.isArray(filters) ? filters.length : !filters ? 0 : 1 : null`

## _React-D3 integration_

D3 code should be created in plain JS (no JSX) and should be placed in separate files for React code.

## Icons

Icons should follow the Design System and be stored in `~/components/ui/icons/` as a `.jsx` file rendering an `<svg>`.

### How to add new icons

1. Get the SVG asset from the designer.
1. Copy the `<svg>` tag into a skeleton React functional component.
1. Delete extraneous HTML artifacts: `<title>`, `id=`, `version`, `xmlns`, `xmlns:xlink`.
1. Change attributes such as `stroke-width` -> `strokeWidth` or `fill-rule` -> `fillRule`.
1. For `width`, `height`, and `viewBox` sizes, use one of the exported sizes in `_elements.scss` whenever possible. (Ex: ``viewBox={`0 0 ${cs.imgM} ${cs.imgM}`}``)
1. If there is just one nested group, remove it and just copy the `fillRule` and `fill`, if defined, to the parent `<svg>`.
1. If the icon needs to change color via a `className` prop, set a default `color` in the `<svg>` tag (e.g. `<svg className={className} color="#3867FA">`).
    - Next, set `fill="currentColor"` on any child `<g>` tags with color. This way a `color` coming from the `className` will override the icon default.
1. Add the icon to `~ui/icons/index.js`. It will automatically appear in your _localhost_`/playground/icons`.
1. Icons should be imported in one statement, e.g. `import { IconAlert, IconLoading } from "~ui/icons"`.

## _CSS_

### File Structure

- We use one scss file per React component, which we place in the same directory as the React component.
- If you need to create related components with common styling (like variations of a component), create a base component that holds all relevant common characterisitcs. The other components will compose this base component. For instance, we defined `PrimaryButton` and `SecondaryButton` render a `Button` and common properties are defined in `button.scss` (even if Button does not do much more than rendering the equivalent `Button` class from `semantic-ui`).

### Naming

- **SCSS Filenames** should use the `snake_case` notation by splitting words with **underscores**
- Selectors should use the `camelCase` notation.
  - The choice for this notation is driven by our decision to use CSS Modules (see next bullet). Legacy code uses `dash-case` typically.
- We use **CSS Modules** to modularize our CSS. This allows us to use short class names without fear of collisions with 3rd party libraries or classes from other components.
  - Our CSS is still in the process of being refactored. All files that are inside the styles directory still use global classes. All new CSS should use CSS modules.
  - See [`Tabs.jsx`](https://github.com/chanzuckerberg/czid-web-private/blob/main/app/assets/src/components/ui/controls/Tabs.jsx) and [`tabs.scss`](https://github.com/chanzuckerberg/czid-web-private/blob/main/app/assets/src/components/ui/controls/tabs.scss) for an example of current best practices.

### Shared Files

Be aware of shared style files, particularly [`_color.scss`](https://github.com/chanzuckerberg/czid-web-private/blob/main/app/assets/src/styles/themes/_colors.scss). Only use color hex values from `_color.scss` and when you need a new color, add it to the file.

### Other Best Practices

- **Don't use `materialize`**: We got rid of it.
- **[Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)** can be very helpful for centering and aligning elements, as well as styling elements to fill up available space. Something to be aware of.

## _JSON_

- Use camelCase for properties in JSON objects (even if writing in Ruby).

## _Ruby_

When in doubt, follow the [Airbnb Ruby Style Guide](https://github.com/airbnb/ruby).

The following rules are particularly relevant to `czid-web`.

### Use keyword arguments with 3 or more parameters to a function.

This makes it easier to add/remove arguments, reason about long lists of arguments, and work with default values. It also improves readability when calling the function.

#### **Avoid**

`def self.samples_going_public_in_period(range, user = nil, project = nil)`

Use: `samples_going_public_in_period([start, start + ahead.days], nil, Project.find(params[:projectId])`

#### **Aspire**

`def self.samples_going_public_in_period(range:, user: nil, project: nil)`

Use: `samples_going_public_in_period(range: [start, start + ahead.days], project: Project.find(params[:projectId])`

### Use Strong Parameters when possible

- [What are Strong Parameters?](https://api.rubyonrails.org/classes/ActionController/StrongParameters.html)
- Use Strong Params whenever possible for security reasons, even if you're passing params to another function.
- Avoid mass assignment whenever possible, even if using Strong Params. Extract specific parameter values instead.
- Use multiple sets of Strong Params if needed for complex controllers.
- This will help us enable Strong Params in Strict Mode and build towards API standardization in the future.

#### **Avoid**

`sample = Sample.new(sample_attributes)`

`@sample.update(sample_params)`

#### **Aspire**

```
def person_params
  params.require(:person).permit(:name, :age)
end
```

### Use specific values with `.as_json` and object serialization

- Responses using `.as_json` or blanket object serialization are permissible for simple objects.
- Restrict to default or specifically defined keys (ex: including `only: SAMPLE_DEFAULT_FIELDS`).
- Avoid blanket serialization for objects such as `Samples` with many fields that are hard to track.
- This is a short-term guideline that will help us consolidate responses for API standardization.

#### **Avoid**

`render json: @sample.as_json`

#### **Aspire**

`render json: { min_contig_reads: min_contig_reads, contig_counts: contig_counts }`

`render json: @sample.as_json(only: SAMPLE_DEFAULT_FIELDS)`

### Avoid unscoped direct object references

- All controller code should refer to an object scope instead of the blanket ActiveRecord object. This ensures that at least some level of access control is checked.
- Even if the model has no scoping, the scope could be as simple as:

```
def self.viewable(user)
  all
end
```
- See also: [Brakeman warning](https://brakemanscanner.org/docs/warning_types/unscoped_find/)

#### **Avoid**

`samples = Sample.where(id: params[:sampleIds])`

`projects = Project.find(id: params[:project_id])`

#### **Aspire**

`samples = current_power.samples.where(id: params[:sampleIds])`

`samples = samples_scope.where(id: params[:sampleIds])`

`projects = current_power.projects.find(id: params[:project_id])`

### Avoid nested ternaries

- Single ternaries are encouraged for simple expressions.
- Double or triple ternaries in Ruby are discouraged.

#### **Avoid**

`loc.is_a?(Array) ? (loc[0] && loc[0].present? ? loc[0] : loc[1]) : loc`

#### **Aspire**

```
if loc.is_a?(Array)
  loc[0] && loc[0].present? ? loc[0] : loc[1]
else
  loc
end
```

### Avoid adding to app/helpers

- We have many legacy "helper" modules in `app/helpers`, but that folder is actually meant for Rails view helpers (which is not relevant in React). Going forward, consider putting utility code in `app/lib` or feature code in the appropriate model or controller instead.
- See here for a general ["Where Do I Put My Code In Rails"](https://codefol.io/posts/where-do-i-put-my-code-in-rails-updated/) guide.

### Error handling in Services

- Services should raise exceptions to communicate errors and allow the caller to handle as desired.
- Bubble up truly unexpected errors to the highest level possible and handle generically.
- Known or expected application errors should raise a custom exception. These can be handled at the controller level or where appropriate.

#### **Aspire**

```
class NoDepthDataError < StandardError
  def initialize(workflow_run)
    super("No depth data available for workflow_run #{workflow_run.id}.")
  end
end
```

### Use camelCase for new controller parameter names

As with the JSON rule above, try to use camelCase for new Rails controller parameter names to standardize. If the value gets saved in a Ruby variable, the Ruby variable name should still be snake_case.

#### **Avoid**

```
params.permit(:name, :project_id, :tax_id, :superkingdom_name, { additional_reference_accession_ids: [], pipeline_run_ids: [] })
```

#### **Aspire**

```
params.permit(:name, :projectId, :taxId, :superkingdomName, { additionalReferenceAccessionIds: [], pipelineRunIds: [] })
```

## Ruby testing

- You do not need to test private methods but make sure everything at a higher level is covered. Try to make sure the entire interface is covered (there will be some special cases where testing private methods will be useful). When reviewing PRs, pay extra attention to ensure the interface is well tested. Read [Unit Testing: Interface vs. Implementation](https://mehulkar.com/blog/unit-testing-interface-vs-implementation/) for more info!
- When in doubt on testing pattern, follow the [Better Specs guide](https://betterspecs.org/).

## Feature flags

- When deploying new features or code, consider if a feature flag is required or desired, to allow the flexibility to turn code on and off.
- CZ ID uses [a lightweight custom feature flag system that is documented in the github wiki](https://github.com/chanzuckerberg/czid-web-private/wiki/%5BDev%5D-Feature-Flags).  Further information about creating and using feature flags can be found in the wiki.
