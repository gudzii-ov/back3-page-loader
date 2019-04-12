# Page loader
[![Maintainability](https://api.codeclimate.com/v1/badges/2ec96a6f32cacc9d106a/maintainability)](https://codeclimate.com/github/gudzii-ov/back3-page-loader/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/2ec96a6f32cacc9d106a/test_coverage)](https://codeclimate.com/github/gudzii-ov/back3-page-loader/test_coverage)
[![Build Status](https://travis-ci.org/gudzii-ov/back3-page-loader.svg?branch=master)](https://travis-ci.org/gudzii-ov/back3-page-loader)

## Installing

Global installation using npm

```bash
$ npm i -g page-loader-gudzii-ov
```

## Example

Download page to current directory

```bash
$ page-loader https://hexlet.io/courses
```

Download page to custom directory

```bash
$ page-loader -o <user directory> https://hexlet.io/courses
```

Enable page-loader specific debug output

```bash
$ DEBUG=page-loader page-loader https://hexlet.io/courses
```
or
```bash
$ DEBUG=page-loader page-loader -o <user directory> https://hexlet.io/courses
```

## Demo Asciinema

[![asciicast](https://asciinema.org/a/238697.png)](https://asciinema.org/a/238697)

### Demo with Listr

[![asciicast](https://asciinema.org/a/239356.png)](https://asciinema.org/a/239356)