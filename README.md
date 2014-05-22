# can.bacon

`can.bacon` is
[hosted at Github](http://github.com/zkat/can.bacon). `can.bacon` is a
public domain work, dedicated using
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Feel free to do
whatever you want with it.

# Quickstart

### Install

`$ npm install can.bacon`
or
`$ bower install can.bacon`

Prebuilt releases are included in `dist`. Releases tagged as `full` include
`Bacon`, `jQuery`, and `CanJS` in a single package. The others expect the other
libraries to have already been loaded.

### Example

```javascript
var compute = can.compute(),
    property = compute.bind();

property.log("Property has new value:");

compute(1);

property.toCanCompute().bind("change", function() {
  console.log("compute updated from property change.");
});

compute(2);

```

# Introduction

`can.bacon` is a [CanJS](https://github.com/bitovi/canjs) plugin that lets you
create [Bacon.js](https://github.com/baconjs/bacon.js) `EventStream`s and
`Property`s from `CanJS` event handlers, as well as feed `Bacon` observable
streams back into `CanJS` observables. The result is a delicious,
canned-bacon-flavored mix of
[FRP](https://en.wikipedia.org/wiki/Functional_reactive_programming) and
`CanJS`-style declarative MVC.

Check out `dist/sandbox.html` and `dist/sandbox.js` for some rough usage
examples, including a fairly short drag-and-drop demo using `can.Component`, and
super-simple, single-line two-way binding between pairs of computes and pairs of
`can.Map`s. More documentation and test suite work is forthcoming.
