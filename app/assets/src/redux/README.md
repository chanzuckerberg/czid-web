# About IDseq Redux

We use [Redux-Toolkit](https://redux-toolkit.js.org/) for our Redux development.

New to Redux and Redux-Toolkit? Visit Redux [essentials](https://redux.js.org/tutorials/essentials/part-1-overview-concepts), Redux-Toolkit [usage guide](https://redux-toolkit.js.org/usage/usage-guide) and [Building React Applications with Idiomatic Redux](https://egghead.io/courses/building-react-applications-with-idiomatic-redux) (with Dan Abramov, the creator of Redux).

## Redux Modules

For each unique feature within IDseq that ulitizes Redux, create a module if it does not exist already. A module represents all Redux functionality pertaining to a feature. See:

- [Example](https://github.com/chanzuckerberg/czid-web-private/blob/main/app/assets/src/redux/modules/discovery)

## Slices

Our Redux state is typically organized into "slices" and those slices being dedicated to a particular feature. Redux Toolkit includes a [createSlice](https://redux-toolkit.js.org/usage/usage-guide#creating-slices-of-state) function that will auto-generate the action types and action creators for you, based on the names of the reducer functions you provide.

See:

- [Example](https://github.com/chanzuckerberg/czid-web-private/blob/main/app/assets/src/redux/modules/discovery/slice.js)

## Selectors

Selectors are used to select certain information from the Redux global state tree. Redux Toolkit re-exports the [createSelector](https://redux-toolkit.js.org/api/createSelector) utility from the [Reselect](https://github.com/reduxjs/reselect) library for ease of use.

- [Example](https://github.com/chanzuckerberg/czid-web-private/blob/main/app/assets/src/redux/modules/discovery/selectors.js)

## Reducers

Reducers are functions that must follow special some rules:

- They should only calculate the new state value based on the state and action arguments
- They are not allowed to modify the existing state. Instead, they must make immutable updates, by copying the existing state and making changes to the copied values.
- They must not do any asynchronous logic or other "side effects"

However, Redux Toolkit's [createReducer](https://redux-toolkit.js.org/api/createReducer#overview) uses [immer](https://github.com/immerjs/immer) and lets you write reducers as if they were mutating the state directly. In reality, the reducer receives a proxy state that translates all mutations into equivalent copy operations. For an example, check out the reducer in the slice in the section above
