# can.bacon

`can.bacon` is a [CanJS](https://github.com/bitovi/canjs) plugin that lets you
create [Bacon.js](https://github.com/baconjs/bacon.js) `EventStream`s and
`Property`s from `CanJS` event handlers, as well as feed `Bacon` observable
streams back into `CanJS` observables. The result is a delicious,
canned-bacon-flavored mix of
[FRP](https://en.wikipedia.org/wiki/Functional_reactive_programming) and
`CanJS`-style declarative MVC.

`can.bacon` implements the
[can.eventstream](https://github.com/zkat/can.eventstream) interface and
adds a few methods to `Bacon` objects (documented below). For information on the
`CanJS` side of the interface, please refer to `can.eventstream`'s documentation.

Check out `dist/sandbox.html` and `dist/sandbox.js` for some rough usage
examples, including a fairly short drag-and-drop demo using `can.Component`, and
super-simple, single-line two-way binding between pairs of computes and pairs of
`can.Map`s.

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

# Documentation

For the most part, `can.bacon` is a straightforward implementation of the
`can.eventstream` interface. For most bindings, it will return a
`Bacon.EventStream` instance. The only exception to this is when bindings are
made to `can.compute` instances, in which case a `Bacon.Property` is returned,
with the current value of the `can.compute` as its initial value.

`can.bacon` also extends `Bacon.Observable.prototype` with a few utility methods
that directly wrap `can.eventstream` functions, documented below.

### `Bacon.Observable#toCanCompute([compute=can.compute()])`

Wraps `can.bindComputeFromStream`.

`stream.toCanCompute(compute)` is the same as `can.bindComputeFromStream(stream,
compute);`

### `Bacon.Observable#toCanMap([map=new can.Map()])`

Wraps `can.bindMapFromStream`.

`stream.toCanMap(compute)` is the same as `can.bindMapFromStream(stream,
compute);`

### `Bacon.Observable#toCanList([list=new can.List()])`

Wraps `can.bindListFromStream`.

`stream.toCanList(compute)` is the same as `can.bindListFromStream(stream,
compute);`
