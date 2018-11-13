# IDSeq Frontend Development Guidelines (WIP)

The goal of this document is to present a set of guidelines, conventions and best practices to develop frontend code for IDseq. It is an ongoing effort as opposed to a thorough document.
These guidelines should be enforced for any new PRs.

* * *

## Practical Code Guidelines

### _Javascript_

When in doubt, follow the [Airbnb JS Style Guide](https://github.com/airbnb/javascript).

The following rules are particularly relevant to `idseq-web`.

**References**

Use `const` to define local references and `let` if you need to reassign them. Do not use `var`.

**Naming**

1. **Identifiers (variables, objects and methods)** should be named using `camelCase` notation starting with a **lowercase** letter
2. **Classes and filenames** are named using `CamelCase` notation starting with an **uppercase** letter
3. Use **descriptive names**. Longer descriptive names are preferred to short cryptic ones, e.g. `convertThresholdedFiltersToJson` vs `convThresh` (great if you can be both short and descriptive...)
4. Names for specific purposes:
    1. **Event handlers**: should be prefixed with `handle...` and, e.g. `handleThresholdApplyClick`
    2. **Event hooks**: should be prefixed with `on...` e.g. `onApplyClick` 
        1. Example: `<Button onClick={this.handleButtonClick} />`
        2. `onClick` is a **hook** (kind of like a parameter), which allows a **handler** like `handlerButtonClick` to be supplied by a client. 
    3. **Boolean methods**: should be prefixed with a verb `is` or `has`, e.g. `isThresholdValid` 

**Strings**

* Quotes: use double quotes (`"`) by default.
* Prefer template strings over concatenation: ``this string has a ${variable}``  over  `"this string has a " + variable`.

**Type Checking**

* Always specify type checking of components properties using the `[prop-types](https://www.npmjs.com/package/prop-types)` module. Be as precise as possible.
* [Airbnb's prop types validators](https://github.com/airbnb/prop-types) is installed and provides extra validators. 
* If your component does not pass any props to its children, always encapsulate your `propTypes` object in the `forbidExtraProps` function from the `airbnb-prop-types` package.

**`lodash/fp`**

[`lodash/fp`](https://github.com/lodash/lodash/wiki/FP-Guide) provides nice immutable utility functions (see React section below on immutability). We use `lodash/fp` exclusively (no `lodash`) in order to prevent confusion between the two variants.

See [Higher-Order Functions in Lodash](
https://blog.pragmatists.com/higher-order-functions-in-lodash-3283b7625175) for some examples of using `lodash/fp` in practice.

`lodash/fp` has many useful functions, and you should use them whenever possible to simplify your code.

**Other Best Practices**

* **Import Aliases:** Use aliases like `~` and `~styles` to reduce long relative paths (`../../../..`). Check out the aliases in `config.resolve.alias` in our webpack config.

### _React Components_

**Repository Structure**

We define the following tree structure for the React `components` (changes to the structure will probably be need to accommodate new features but should be carefully considered):

* The `ui` folder contains generic, reusable components. This establishes a layer of indirection to component implementation, allowing us to easily change the underlying implementation (e.g. we currently use an external framework `semantic-ui` but could decide to switch a component to our own implementation) 
    * `controls` : contains components that allow the user to control the workflow of the page
        * `buttons` 
        * `dropdowns` 
    * `layout` : contains components that allow you to organize content on a page (modal, buttons)
    * `icons` : react components that encapsulated svg icons
* `visualizations` : components for data visualizations. Most of these will be using d3. This components should be generic and not attached to any particular type of data, e.g. `Heatmap` does not need to be applied to samples comparison
* `views` : these are IDSeq specific views like `SamplesView`. These are customized to a particular set of data and are **not** generic (they are specific to IDSeq). Views can be composed by other views.

If a React component required the use of utility Javascript classes, there are two options:

1. If the utility class is to be **shared** among components, consider putting it in `components/utils`.
2. If the utility is built specifically for a given component, define a new folder `<ComponentName> `where the component was previously located and move the component and the utility class into that folder.


**Reusable Components (`ui.[...]`)**

Try to use the reusable components in `ui` whenever possible.

If you need a custom component for your view, see whether you can wrap an existing component instead of writing your own.

For example, if you need a specially styled button, try to wrap `<Button>` from `ui` instead of creating your own `<button>` element.

**Component Design**

[Thinking in React](https://reactjs.org/docs/thinking-in-react.html) from the official React docs is highly recommended reading.

[Presentational and Contatiner Components](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) from Dan Abhramov (co-author of Redux) is also great for learning how to think in React.

Try to break components down into smaller components, each of which has a single specialized task, instead of writing huge monolithic components (like `<PipelineSampleReport`, which is currently in our code-base). This approach improves **separation of concerns**, makes things easier to reason about, and encourages reusability.

Whenever possible, try to perform the bulk of business logic in pure functions (i.e. functions that just take inputs and outputs and don't call `this.setState`). Factor these pure functions out of the component into utility files (`./utils.js`). This keeps the component slim and focused on the core business logic and rendering.


**Component Naming**

* Include the type of the component as a **suffix** of the name. For instance:
    * `PrimaryButton`
    * `SamplesView`
    * `HeatmapVisualization`


**Component Structure**

If your component is simple and has no styling, a single `.jsx` file will do.

If your component has styling, you should create a `.scss` file in the same folder as the `.jsx`. (Also see styling section below)

Once your component has more than a single `.jsx` and .`scss` file, you should create a separate folder to hold your component. Follow the convention below:

* `Table`
    * `index.jsx`
    * `Table.jsx`
    * `Table.scss`
    * `Header.jsx`
    * `Header.scss`
    * `Row.jsx`
    * `Row.scss`


Where the `index.jsx` file is a simple redirect:

`// Contents of index.jsx` \
`import Table from "./Table";` \
`export default Table;`


**Views**

Views represent a page or a section of a page in IDSeq. Views are stored in the `views` folder. 
When designing your view, try to make as much use of the components in the `ui `and `visualizations` folders. This should be mostly plug-and-play components. 
If you need to place a ui component in a customized place for your view (i.e. if the layout elements cannot help you), wrap it in a `div` with a proper class name, and style it in the view's css file.

**Other Best Practices**

* **Don't Mutate Objects:** Always create a new object/array when modifying component state, instead of modifying the original object (even if you call `setState` afterward). This allows React to figure out if props have changed by via shallow comparison, and allows for future rendering optimizations using `React.PureComponent`. `lodash/fp` functions are immutable and do this by default.

* **Use Arrow Functions:** Inside React components, define instance methods with arrow function syntax `foo = () => { ... }`. This removes the need for `this.foo = this.foo.bind(this)`.

* **Isolate API Calls:** Put all new API calls inside the `api` folder and use `get` and `postWithCSRF` instead of calling `axios` directly. The layer of indirection allows us to do things like convert snake_case to CamelCase and do standardized error handling in the future.

* **Be Conscious of setState:** Be very careful of the the asynchronous nature of `this.setState`, as it can lead to subtle bugs. The `prevState` version (`this.setState(prevState => {}`) can work as a quick fix, but overuse of `prevState` and wrapping entire functions in `this.setState` is discouraged. You can often reorganize your functions to remove the bug (and also clarify the different code flows).

### React-D3 integration 

*WIP*
D3 code should be created in plain JS (no JSX) and should be placed in separate files for React code.


### _CSS_

**File Structure**

* We use one scss file per React component, which we place in the same directory as the React component.
* If you need to create related components with common styling (like variations of a component), create a base component that holds all relevant common characterisitcs. The other components will compose this base component.  For instance, we defined `PrimaryButton` and `SecondaryButton` render a `Button` and common properties are defined in `button.scss` (even if Button does not do much more than rendering the equivalent `Button` class from `semantic-ui`).

**Naming**

1. **SCSS Filenames** should use the `snake_case` notation by splitting words with **underscores**
2. Selectors should use the `camelCase` notation. 
    1. The choice for this notation is driven by our decision to use CSS Modules (see next bullet). Legacy code uses `dash-case` typically.
3. We use **CSS Modules** to modularize our CSS. This allows us to use short class names without fear of collisions with 3rd party libraries or classes from other components. 
    1. Our CSS is still in the process of being refactored. All files that are inside the styles directory still use global classes. All new CSS should use CSS modules.
    2.  See `components/views/cli_user_instructions.scss` for an example of the current best practice.

**Other Best Practices**

* **Don't use `materialize`**: We are trying to get rid of it.
* **[Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)** is very useful for vertical centering and responsive layouts.

### _JSON_

* Use camelCase for properties in JSON object (even if writing in Ruby).
