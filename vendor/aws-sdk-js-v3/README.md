# AWS SDK vendor files

## Background

This folder contains `aws-sdk-js-v3` packages built and installed from the source following [the instructions in the repository's README](https://github.com/chanzuckerberg/aws-sdk-js-v3#install-from-source) from the [CZI fork of the aws-sdk-js-v3 repo](https://github.com/chanzuckerberg/aws-sdk-js-v3).  In March of 2022, the `aws-sdk-js-v3` library was forked to add the ability to resume uploads in the `Upload` lib and other customizations.

Since we are using a forked repository, we are not able to install modularlized packages from npm, which is why we need to build them ourselves.

## Prerequisites

* `cmake` - required for `aws-crt`

    ```sh
    brew install cmake
    ```

* (for arm/M1 macs) `chromium` - `puppeteer` binary not available for arm/M1

    ```sh
    brew install chromium --no-quarantine
    ```

  * More context around [the workaround](https://linguinecode.com/post/how-to-fix-m1-mac-puppeteer-chromium-arm64-bug) and [the `chromium is damaged` issue which `--no-quarantine` solves](https://www.reddit.com/r/MacOS/comments/q9d772/homebrew_chromium_is_damaged_and_cant_be_openend/).

## Process to update and build AWS SDK packages from forked repo

1. Check out the [CZI fork of the aws-sdk-js-v3 repo](https://github.com/chanzuckerberg/aws-sdk-js-v3)
1. Make updates in the forked `aws-sdk-js-v3` repository.
1. Run `bin/update_aws_sdk_packages.sh` in `czid-web` repo to build packages from AWS SDK and copy and install them in `czid-web`.  See [below for more information about the script](https://github.com/chanzuckerberg/czid-web-private/tree/main/vendor/aws-sdk-js-v3#automated-script-to-build-and-install-packages).
1. Run `npm ci` to install/update the package.
1. If needed, make sure the Dockerfile copies the new package archive into the docker container so that docker images can be built.  The Dockerfile currently copies all files in this folder into the image.

## Automated script to build and install packages

The `bin/update_aws_sdk_packages.sh` script is the recommended way to keep our forked AWS SDK libs up to date.  It automatically builds, copies, and installs the packages that we use from `aws-sdk-js-v3`.  Note that while we can manually build and install the packages, among other things, the script automatically adds a short git SHA to the filename so we can better track what version of the AWS SDK we are using.

Any new AWS packages that we need to install from the forked SDK should be added in the script.  The variables `package_prefixes`, `module_paths`, and `npm_package_name` all need to be updated, preserving the order in each.

### Prerequisites for automated script

* above prerequisite steps completed
* aws-sdk repo is checked out in parent folder of czid-web repo

## AWS SDK packages to build

[Installing only the specific packages AWS SDK packages](https://github.com/chanzuckerberg/aws-sdk-js-v3#install-from-source) that we need in the app allows us to minimize the amount of code we are importing.  As of this writing, we currently use the following packages from `aws-sdk-js-v3`:

* `clients/client-s3`
* `lib/lib-storage`

## Maintenance

The [CZI fork of `aws-sdk-js-v3`](https://github.com/chanzuckerberg/aws-sdk-js-v3) should be periodically [synced with the upstream repo](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork), to make sure that we receive any critical updates.  After the fork is synced, the individual packages used need to [be rebuilt from source](https://github.com/chanzuckerberg/aws-sdk-js-v3#install-from-source) and copied into this repository.
