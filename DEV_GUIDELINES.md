# IDSeq Frontend Development Guidelines (WIP)

The goal of this document is to present a set of guidelines, conventions and best practices to develop frontend code for IDseq. It is an ongoing effort as opposed to a thorough document.
These guidelines should be enforced for any new PRs.

* * *

## _Javascript_

When in doubt, follow the [Airbnb JS Style Guide](https://github.com/airbnb/javascript).

The following rules are particularly relevant to `idseq-web`.

### References

Use `const` to define local references and `let` if you need to reassign them. Do not use `var`.

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

### Strings

* Quotes: use double quotes (`"`) by default.
* Prefer template strings over concatenation: ``this string has a ${variable}``  over  `"this string has a " + variable`.

### Type Checking

* Always specify type checking of components properties using the `[prop-types](https://www.npmjs.com/package/prop-types)` module. Be as precise as possible.
* [Airbnb's prop types validators](https://github.com/airbnb/prop-types) is installed and provides extra validators. 
* If your component does not pass any props to its children, always encapsulate your `propTypes` object in the `forbidExtraProps` function from the `airbnb-prop-types` package.

### `lodash/fp`

[`lodash/fp`](https://github.com/lodash/lodash/wiki/FP-Guide) provides nice immutable utility functions (see React section below on immutability). We use `lodash/fp` exclusively (no `lodash`) in order to prevent confusion between the two variants.

See [Higher-Order Functions in Lodash](
https://blog.pragmatists.com/higher-order-functions-in-lodash-3283b7625175) for some examples of using `lodash/fp` in practice.

`lodash/fp` has many useful functions, and you should use them whenever possible to simplify your code.

A good rule of thumb: if you ever find yourself wanting to use a for loop, `lodash/fp` can help. 

### Other Best Practices

* **Import Aliases:** Be aware of our [Webpack aliases](https://github.com/chanzuckerberg/idseq-web/blob/master/webpack.config.common.js). Use them to avoid long relative paths (`../../../..`) in imports.

## _React Components_

### Repository Structure

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


### Reusable Components (`ui.[...]`)

Try to use the reusable components in `ui` whenever possible.

If you need a custom component for your view, see whether you can wrap an existing component instead of writing your own.

For example, if you need a specially styled button, try to wrap `<Button>` from `ui` instead of creating your own `<button>` element.

### Component Design

* Avoid monolithic components. Break complex components up into smaller units.
    * No strict guidelines for how to do this, but it's similar to the process of breaking up a complex function into smaller parts. Find small self-contained units. For example, a component whose job is to receive data and render a particular piece of UI. Strive for each component to have a single, well-defined responsibility. 
    * This makes code easier to reason about and encourages reusability.
* Components should usually be no more than 250 lines.
* Pull business logic out of the component and into pure utility functions whenever possible. Better readability, and easier to unit-test further down the line. Also keeps the component slim and focused on the core business logic and rendering.
* If you find yourself passing a ton of props into a component, consider combining related props into a single object with a descriptive name. For example, if you have a bunch of sample-related props that you're passing into a phylo creation modal, combine them into a single object prop called phyloCreationSampleProps. 
    * You can also use this approach to reduce the number of top-level this.state variables.
* See <SampleDetailsSidebar> (https://github.com/chanzuckerberg/idseq-web/tree/master/app/assets/src/components/views/report/SampleDetailsSidebar) for a real-life example.

Resources:
[Thinking in React](https://reactjs.org/docs/thinking-in-react.html)
[Presentational and Container Components](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)

### Component Naming

* Include the type of the component as a **suffix** of the name. For instance:
    * `PrimaryButton`
    * `SamplesView`
    * `HeatmapVisualization`


### Component Structure

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


### Views

Views represent a page or a section of a page in IDSeq. Views are stored in the `views` folder. 
When designing your view, try to make as much use of the components in the `ui `and `visualizations` folders. This should be mostly plug-and-play components. 
If you need to place a ui component in a customized place for your view (i.e. if the layout elements cannot help you), wrap it in a `div` with a proper class name, and style it in the view's css file.

### Shared Files

**API calls**
Put API calls in [`/api`](https://github.com/chanzuckerberg/idseq-web/tree/master/app/assets/src/api). Use and build upon the provided api methods like `postWithCSRF` and `get` instead of directly using `axios`. This layer of indirection allows us to do things like standardized error handling and converting snake case to camel case for all our API endpoints further down the line.

Start putting fetch methods like `fetchSampleMetadata` in `/api`, so that it's easy to see all the back-end endpoints the front-end is using.


### PropTypes

When passing complex objects as props, add the structure of the object to a `propTypes.js` file. If the object is ad-hoc and very specific to the component, put the propTypes file inside the component directory. If the object will be used widely across the app, put it in [`utils/propTypes.js`](https://github.com/chanzuckerberg/idseq-web/blob/master/app/assets/src/components/utils/propTypes.js) 


### Other Best Practices

* **Don't Mutate Objects:** Always create a new object/array when modifying component state, instead of modifying the original object (even if you call `setState` afterward). This allows React to figure out if props have changed by via shallow comparison, and allows for future rendering optimizations using `React.PureComponent`. `lodash/fp` functions are immutable and do this by default.

* **Use Arrow Functions:** Inside React components, define instance methods with arrow function syntax `foo = () => { ... }`. This removes the need for `this.foo = this.foo.bind(this)`.

* **Be Conscious of setState:** Be very careful of the the asynchronous nature of `this.setState`, as it can lead to subtle bugs. The `prevState` version (`this.setState(prevState => {}`) can work as a quick fix, but overuse of `prevState` and wrapping entire functions in `this.setState` is discouraged. You can often reorganize your functions to remove the bug (and also clarify the different code flows).

## _React-D3 integration_ 

*WIP*
D3 code should be created in plain JS (no JSX) and should be placed in separate files for React code.


## _CSS_

### File Structure

* We use one scss file per React component, which we place in the same directory as the React component.
* If you need to create related components with common styling (like variations of a component), create a base component that holds all relevant common characterisitcs. The other components will compose this base component.  For instance, we defined `PrimaryButton` and `SecondaryButton` render a `Button` and common properties are defined in `button.scss` (even if Button does not do much more than rendering the equivalent `Button` class from `semantic-ui`).

### Naming

* **SCSS Filenames** should use the `snake_case` notation by splitting words with **underscores**
* Selectors should use the `camelCase` notation. 
    * The choice for this notation is driven by our decision to use CSS Modules (see next bullet). Legacy code uses `dash-case` typically.
* We use **CSS Modules** to modularize our CSS. This allows us to use short class names without fear of collisions with 3rd party libraries or classes from other components. 
    * Our CSS is still in the process of being refactored. All files that are inside the styles directory still use global classes. All new CSS should use CSS modules.
    *  See [`Tabs.jsx`](https://github.com/chanzuckerberg/idseq-web/blob/master/app/assets/src/components/ui/controls/Tabs.jsx) and [`tabs.scss`](https://github.com/chanzuckerberg/idseq-web/blob/master/app/assets/src/components/ui/controls/tabs.scss) for an example of current best practices.
    
### Shared Files

Be aware of shared style files, particularly [`_color.scss`](https://github.com/chanzuckerberg/idseq-web/blob/master/app/assets/src/styles/themes/_colors.scss). Only use color hex values from `_color.scss` and when you need a new color, add it to the file.
    
### Other Best Practices

* **Don't use `materialize`**: We are trying to get rid of it.
* **[Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)** can be very helpful for centering and aligning elements, as well as styling elements to fill up available space. Something to be aware of. 

## _JSON_

* Use camelCase for properties in JSON object (even if writing in Ruby).
