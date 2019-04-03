# Page loader
[![Maintainability](https://api.codeclimate.com/v1/badges/3b3a27ed5ee98268b22a/maintainability)](https://codeclimate.com/github/gudzii-ov/project-lvl3-s444/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/3b3a27ed5ee98268b22a/test_coverage)](https://codeclimate.com/github/gudzii-ov/project-lvl3-s444/test_coverage)
[![Build Status](https://travis-ci.org/gudzii-ov/project-lvl3-s444.svg?branch=master)](https://travis-ci.org/gudzii-ov/project-lvl3-s444)

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

Demo Asciinema

[![asciicast](https://asciinema.org/a/238590)](https://asciinema.org/a/238590)