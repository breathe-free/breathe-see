#!/bin/sh
# See https://gist.github.com/TooTallNate/3288316 
VERSION=0.10.28
PLATFORM=linux
ARCH=arm-pi
PREFIX="/usr/local"

mkdir -p "$PREFIX" && \
curl http://nodejs.org/dist/v$VERSION/node-v$VERSION-$PLATFORM-$ARCH.tar.gz \
  | tar xzvf - --strip-components=1 -C "$PREFIX"
