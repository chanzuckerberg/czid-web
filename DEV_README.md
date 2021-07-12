This page and similar pages are mostly intended for internal consumption by IDseq engineers.

## Structure
- Look for more `README.md` files at subdirectory levels for more specific content per component, e.g. `db/README.md`.
- It is also encouraged to have detailed [file/class-level comments](https://github.com/airbnb/ruby#fileclass-level-comments) to keep relevant documentation close to the code.

## Helpful links
Check out the pages in the [GitHub wiki](https://github.com/chanzuckerberg/idseq-web-private/wiki), especially these two starting links:
  - [[Dev] A starting point: initial setup](https://github.com/chanzuckerberg/idseq-web-private/wiki/%5BDev%5D-A-starting-point:-initial-setup)
  - [[Dev] General development information and tooling](https://github.com/chanzuckerberg/idseq-web-private/wiki/%5BDev%5D-General-development-information-and-tooling)
  - For new content, try adding it in a README file instead of the wiki to have it closer to the code.

We also have a collection of docs in the [CZI One Confluence wiki](https://czi.atlassian.net/wiki/spaces/SCI/pages/1721337866/IDseq+Engineering).

## package.json

### Notes on understanding dependency advisories

- You can find Dependabot alerts in the [Security tab](https://github.com/chanzuckerberg/idseq-web-private/security) and additional advisories from `npm audit`.
- Identify if the warning is for a package in `devDependencies` or production `dependencies` (generally more impactful). Run `npm audit --production` to see only production deps.
- More notes from Snyk (direct vs indirect deps, dep paths vs. unique deps): https://snyk.io/blog/whats-an-npm-dependency/
- Unfortunately, many warnings are just low signal and not relevant for how the packages are actually being used. Look carefully at what the CVE is saying would be vulernable input. See [npm audit: Broken by Design](https://overreacted.io/npm-audit-broken-by-design/) and this [related example](https://github.com/facebook/create-react-app/issues/11174).
