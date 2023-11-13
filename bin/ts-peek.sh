#!/bin/bash
if [[ `git status --porcelain` ]]; then
  # Changes
  echo "Commit your changes and then try rerunning this script. ❌"
else
  # No changes
  echo "Temporarily removing // @ts-expect-error enable strictNullChecks comments..."
  grep -nr "@ts-expect-error CZID-8698" app/assets/src > app/assets/file3.txt
  node scripts/uncomment-check.ts --filepath app/assets/file3.txt
  echo "Checking for TSC errors hidden by // @ts-expect-error comments..."
  npx tsc -p ./app/assets/tsconfig.json --strictNullChecks false --noemit
  if [ "$?" -eq "0" ]
  then
    echo "Restoring // @ts-expect-error comments..."
    git restore .
    git clean -f
    echo "Congrats! No errors found. ✅"
    exit 0
  else
    echo "Restoring // @ts-expect-error comments..."
    git restore .
    git clean -f
    echo "TSC errors found 👀. Please fix them before committing. ❌"
    exit 1
  fi
fi