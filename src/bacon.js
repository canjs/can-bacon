module bacon from "bacon";
module can from "can";
import "can/eventstream";

/**
 * Wraps `can.bindComputeFromStream`.
 *
 * `stream.toCanCompute(compute)` is the same as
 * `can.bindComputeFromStream(stream, compute);
 */
bacon.Observable.prototype.toCanCompute = function(compute=can.compute()) {
  return can.bindComputeFromStream(this, compute);
};

/**
 * Wraps `can.bindMapFromStream`.
 *
 * `stream.toCanMap(compute)` is the same as
 * `can.bindMapFromStream(stream, compute);
 */
bacon.Observable.prototype.toCanMap = function(map=new can.Map()) {
  return can.bindMapFromStream(this, map);
};

/**
 * Wraps `can.bindListFromStream`.
 *
 * `stream.toCanList(compute)` is the same as
 * `can.bindListFromStream(stream, compute);
 */
bacon.Observable.prototype.toCanList = function(list=new can.List()) {
  return can.bindListFromStream(this, list);
};

can.isEventStream = (stream) => stream instanceof bacon.Observable;
can.onEventStreamValue = (stream, callback) => stream.onValue(callback);
can.bindEventStream = function(ctx, ev, selector) {
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
can.eventStreamUntil = (stream, until) => stream.takeUntil(until);

function chooseEventData(ctx, eventArgs, evName) {
  if (ctx.isComputed) {
    return eventArgs[1];
  } else if (ctx.getEventValueForStream) {
    return ctx.getEventValueForStream(eventArgs, evName);
  } else {
    return eventArgs[0];
  }
}
