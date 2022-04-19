#!/bin/bash
# This script builds the packages we use from our forked aws-sdk repo,
# copies the script to the vendor folder, and reinstalls the package

# This script assumes the forked aws-sdk repo is checked out at the same
# level as the czid-web repo

# This script also assumes that you have completed the prequisite steps
# in the README:
# https://github.com/chanzuckerberg/czid-web-private/blob/main/vendor/aws-js-sdk-v3/README.md#prerequisites

######## AWS SDK JS package information
# NOTE: Any additional AWS packages that we want to build and install can
# be added in thse variables

# prefix for the file built by yarn pack
package_prefixes=(
  "aws-sdk-client-s3-v"
  "aws-sdk-lib-storage-v"
)
# paths are relative to aws-sdk-js-v3 root dir
module_paths=(
  "clients/client-s3"
  "lib/lib-storage"
)
# Modularized npm package name
npm_package_name=(
  "@aws-sdk/client-s3"
  "@aws-sdk/lib-storage"
)
######## END AWS SDK JS package information

BASE_DIR=$(pwd)
BASE_DIR_BASENAME=$(basename $(pwd))
AWS_SDK_JS_DIR=../aws-sdk-js-v3
AWS_VENDOR_DIR=$BASE_DIR/vendor/aws-sdk-js-v3

# Check if we are in root directory of czid-web-private repo
([[ $BASE_DIR_BASENAME != "czid-web-private" ]] || [[ ! -d $AWS_VENDOR_DIR ]]) \
  && echo "Script must be run from root folder of repo" \
  && exit

# Check that the aws sdk repo is checked out in the correct location
[[ ! -d $AWS_SDK_JS_DIR ]] \
  && echo "aws-sdk-js-v3 should be in parent directory of this repo" \
  && exit

AWS_BASE_DIR=$BASE_DIR/$AWS_SDK_JS_DIR

for (( i = 0; i < ${#module_paths[@]}; ++i )); do

    echo "Running 'yarn build' and 'yarn pack' in $AWS_BASE_DIR/${module_paths[i]}"
    cd $AWS_BASE_DIR/${module_paths[i]}

    yarn build
    yarn pack

    current_sha=$(git rev-parse --short=7 HEAD)

    # Get current package version from package.json
    package_version=$(grep '"version":' package.json | cut -d \" -f4)
    package_name="${package_prefixes[i]}$package_version.tgz"
    sha_package_name="${package_prefixes[i]}$package_version-$current_sha.tgz"

    echo -e "\nRemoving these previous versions of ${npm_package_name[i]}: "
    echo $(find $AWS_VENDOR_DIR -name "${package_prefixes[i]}*")
    find $AWS_VENDOR_DIR -name "${package_prefixes[i]}*" -delete

    echo -e "\nCopying $package_name to $AWS_VENDOR_DIR..."
    cp $package_name $AWS_VENDOR_DIR/$sha_package_name

    echo -e "\nSwitching to $BASE_DIR and reinstalling ${npm_package_name[i]} from $AWS_VENDOR_DIR/$sha_package_name..."
    cd $BASE_DIR
    npm uninstall ${npm_package_name[i]}
    npm i "$AWS_VENDOR_DIR/$sha_package_name"
done
