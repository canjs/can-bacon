module bacon from "bacon";
module can from "can";

/**
 * Returns a `can.compute` whose value changes whenever `observable`'s value
 * changes.
 */
bacon.Observable.prototype.toCanCompute = function() {
  var compute = can.compute();
  this.onValue(compute);
  return compute;
};

/**
 * Returns a `can.List` whose value is replaced by each new value of the
 * Observable.
 */
bacon.Observable.prototype.toCanList = function() {
  var list = new can.List();
  this.assign(list, "replace");
  return list;
};
