module bacon from "bacon";
module can from "can";
import "can.eventstream";

/**
 * Wraps `can.bindComputeFromStream`.
 *
 * `stream.toCompute(compute)` is the same as
 * `can.bindComputeFromStream(stream, compute);`
 */
bacon.Observable.prototype.toCompute = function(compute=can.compute()) {
  return can.bindComputeFromStream(this, compute);
};

/**
 * Wraps `can.bindMapFromStream`.
 *
 * `stream.toMap(compute)` is the same as
 * `can.bindMapFromStream(stream, compute);`
 */
bacon.Observable.prototype.toMap = function(map=new can.Map()) {
  return can.bindMapFromStream(this, map);
};

/**
 * Wraps `can.bindListFromStream`.
 *
 * `stream.toList(compute)` is the same as
 * `can.bindListFromStream(stream, compute);`
 */
bacon.Observable.prototype.toList = function(list=new can.List()) {
  return can.bindListFromStream(this, list);
};

can.EventStream = {};
can.EventStream.isEventStream = (stream) => stream instanceof bacon.Observable;
can.EventStream.onValue = (stream, callback) => stream.onValue(callback);
can.EventStream.bind = function(ctx, ev, selector) {
  ev = ev == null ? "change" : ev;
  var stream = bacon.fromBinder(function(sink) {
    function cb() {
      sink(new bacon.Next(chooseEventData(ctx, arguments)));
    }
    selector ?
      can.delegate.call(ctx, selector, ev, cb) :
      can.bind.call(ctx, ev, cb);
    return ()=>selector ?
      can.undelegate.call(ctx, selector, ev, cb) :
      can.unbind.call(ctx, ev, cb);
  });
  if (ctx.isComputed) {
    // Computes are a special case in the sense that it's fairly involved to set
    // up a property, and we almost always want to bind computes as properties
    // -- so in this specific case we return a property instead of a stream, to
    // help sanity.
    stream = stream.toProperty(ctx());
  }
  return stream;
};
can.EventStream.untilStream = (stream, until) => stream.takeUntil(until);

function chooseEventData(ctx, eventArgs, evName) {
  if (ctx.isComputed) {
    return eventArgs[1];
  } else if (ctx.getEventValueForStream) {
    return ctx.getEventValueForStream(eventArgs, evName);
  } else {
    return eventArgs[0];
  }
}
