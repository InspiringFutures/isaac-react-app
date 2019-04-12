#! /bin/bash

set -e # Exit on failure

if test -z "$1"; then
  read -p "isaac-cs-app version to build (e.g. v1.3.0 or 'master'):" VERSION_TO_DEPLOY
else
  VERSION_TO_DEPLOY="$1"
fi

BUILD_DIR=/tmp/isaacCSDeploy

echo Building Isaac CS in $BUILD_DIR

rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR
cd $BUILD_DIR

git clone -b $VERSION_TO_DEPLOY --depth 1 https://github.com/isaacphysics/isaac-cs-app.git
cd isaac-cs-app

# Determine segue version to use. Honest.
if [[ $VERSION_TO_DEPLOY == v* ]]; then
    source .env
    SEGUE_VERSION=$REACT_APP_API_VERSION
else
    # Change the app src to request the API from a particular branch
    if test -z "$2"; then
          read -p "Override API version to target [$VERSION_TO_DEPLOY]" SEGUE_VERSION
    else
          SEGUE_VERSION=$2
    fi
    SEGUE_VERSION=${SEGUE_VERSION:-$VERSION_TO_DEPLOY}

    echo "REACT_APP_API_VERSION=" $SEGUE_VERSION >> .env
fi

npm install &&
npm run build &&
docker build -t "docker.isaacscience.org/isaac-cs-app:${VERSION_TO_DEPLOY,,}" --build-arg API_VERSION=$SEGUE_VERSION . &&
docker push "docker.isaacscience.org/isaac-cs-app:${VERSION_TO_DEPLOY,,}" ||
exit 1

cd ..
rm -rf isaac-cs-app

git clone -b $SEGUE_VERSION --depth 1 https://github.com/isaacphysics/isaac-api.git &&
cd isaac-api &&
docker build -t "docker.isaacscience.org/isaac-api:$SEGUE_VERSION" . &&
docker push "docker.isaacscience.org/isaac-api:$SEGUE_VERSION" ||
exit 1

cd ..
rm -rf isaac-api
echo "Build complete"
echo "Now run, for example:"
echo "   ./compose dev $VERSION_TO_DEPLOY up -d"
echo
echo "   Er, maybe. That was what we did for Isaac Physics, anyway."