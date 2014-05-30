module bacon from "bacon";
module can from "can";

var oldBind = can.bind;
/**
 * @function can.bind
 *
 * Extends `can.bind()` such that if it's called with only one argument (the
 * event name), or without any arguments, a `Bacon.EventStream` object is
 * created, instead of binding a callback to the event.
 *
 * The actual event values sent into the `EventStream` will vary depending on
 * the observed value.
 *
 * See http://canjs.com/docs/can.bind.html for documentation on the default
 * behavior.
 *
 * @param {Any} this - The object to bind events on. If this object is a
 *                     `Bacon.Observable`, `can.bind` is a no-op, returning
 *                     `this` immediately.
 * @param {String} [event="change"] - Name of event to hook up to
 * @param {Function} [callback] - Callback to invoke when event fires. If this
 *                                parameter is provided, the method will revert
 *                                to its default (non-`can.bacon`) behavior.
 *
 * @returns EventStream | Any
 *
 * @example
 * can.bind.call(new can.Map(), "change").map(".value").log();
 *
 */
can.bind = function(ev, cb) {
  if (this instanceof bacon.Observable) {
    return this;
  } else if (cb) {
    return oldBind.apply(this, arguments);
  } else {
    return toBaconObservable(this, ev);
  }
};

var oldDelegate = can.delegate;
/**
 * @function can.delegate
 *
 * Extends `can.delegate()` such that if it's called with only one or two
 * arguments (the selector, and the event name), a `Bacon.EventStream` object is
 * created, instead of binding a callback to the event.
 *
 * The actual event values sent into the `EventStream` will vary depending on
 * the observed value.
 *
 * See http://canjs.com/docs/can.delegate.html for documentation on the default
 * behavior.
 *
 * @param {Any} this - The object to bind events on. If this object is a
 *                     `Bacon.Observable`, `can.bind` is a no-op, returning
 *                     `this` immediately.
 * @param {Any} selector - The selector to delegate to.
 * @param {String} [event="change"] - Name of event to hook up to.
 * @param {Function} [callback] - Callback to invoke when event fires. If this
 *                                parameter is provided, the method will revert
 *                                to its default (non-`can.bacon`) behavior.
 *
 * @returns EventStream | Any
 *
 * @example
 * can.delegate.call(window, "a", "click").doAction(".preventDefault").log();
 *
 */
can.delegate = function(selector, ev, cb) {
  if (this instanceof bacon.Observable) {
    return this;
  } else if (cb) {
    return oldBind.apply(this, arguments);
  } else {
    return toBaconObservable(this, ev, selector);
  }
};

/**
 * @function can.compute#bind
 *
 * Replaces the default CanJS behavior of the `can.compute#bind()` method with
 * one that returns an `EventStream` of new `can.compute` values, if no
 * `callback` is provided to the `.bind()` call. If the `callback` is present,
 * this method reverts to the standard behavior of binding an event listener
 * directly.
 *
 * @param {String} [event="change"] - Name of event to hook up to
 * @param {Function} [callback] - Callback to invoke when event fires. If this
 *                                parameter is provided, the method will revert
 *                                to its default (non-`can.bacon`) behavior.
 *
 * @returns EventStream | Computed
 *
 * @example
 * var compute = can.compute(1);
 * compute.bind().log("compute changed");
 * compute(2);
 * // compute changed 2
 */


var oldBindAndSetup = can.bindAndSetup;
// Mostly internal, but used to replace the `.bind()` behavior for all
// Observables in Can.
can.bindAndSetup = function(ev, cb) {
  return cb ?
    oldBindAndSetup.apply(this, arguments) :
    toBaconObservable(this, ev);
};

var oldControlOn = can.Control.prototype.on;
/**
 * @function can.Control#on
 *
 * Enhances `can.Control#on` (and by extension, `can.Component#events#on`) so it
 * can be used to listen to event streams in a memory-safe way, according to the
 * control/component's lifecycle. Also allows returning event streams from
 * regular event bindings.
 *
 * See http://canjs.com/docs/can.Control.prototype.on.html
 *
 *
 * @param {Any} [context=this.element] - The object to listen for events on. If
 *                                       this object is a `Bacon.Observable`,
 *                                       this method will immediately return a
 *                                       stream that ends automatically if the
 *                                       `this` (the Control or Component) is
 *                                       destroyed.
 * @param {String} [selector] - If provided, the selector to delegate to.
 * @param {String} [event="change"] - The name of the event to listen to.
 * @param {Function} [callback] - Callback to invoke when event fires. If this
 *                                parameter is provided, the method will revert
 *                                to its default (non-`can.bacon`) behavior.
 *
 * @returns EventStream | Observable | Number
 *
 * @example
 * ...
 * events: {
 *   inserted: function() {
 *     this.on(GlobalStreams.specialEvent).log("special event:");
 *   }
 * }
 * ...
 * $("mycomponent").remove() // logs 'special event: \<end\>'
 * GlobalStreams.specialEvent.push("whatever"); // Nothing happens
 *
 * // The following are also equivalent:
 * this.on(scope, "change").log("Scope changed")
 * this.on(scope).log("Scope changed")
 *
 */
can.Control.prototype.on = function(ctx, selector, eventName, func) {
  if (!ctx) {
    return oldControlOn.apply(this, arguments);
  }
  if (ctx instanceof bacon.Observable) {
    return ctx.takeUntil(can.bind.call(this, "destroyed"));
  }
  if (typeof ctx === "string") {
    func = eventName;
    eventName = selector;
    selector = ctx;
    ctx = this.element;
  }
  if (func == null) {
    func = eventName;
    eventName = selector;
    selector = null;
  }
  if (func == null) {
    return toBaconObservable(ctx, eventName, selector)
      .takeUntil(can.bind.call(this, "destroyed"));
  } else {
    return oldControlOn.apply(this, arguments);
  }
};

/**
 * @function can.Map#bind
 *
 * Replaces the default CanJS behavior of the `can.Map#bind()` method with one
 * that returns an `EventStream` of event objects or values if the `callback`
 * argument is not provided.
 *
 * The values in `EventStream` vary depending on the event being listened to.
 *
 * For named property events, the new value of the property is returned, as-is.
 *
 * For `"change"` events, `MapChangeEvent` objects are returned, with the
 * following properties:
 *
 * {
 *   event: Object // The CanJS event object.
 *   which: String // They attr/key affected by the event,
 *   how: "add"|"remove"|"set" // The type of operation,
 *   value: Any // For "add"/"set" events, the new value. For "remove" events,
 *                 the removed value.
 * }
 *
 * Note that this object fits the API required for `Bacon.toCanMap`, so the
 * `EventStream` returned by this function can be piped into a different
 * `can.Map` to partially or fully synchronise both maps.
 *
 * Additionally, The events from that `Map` changing can then be piped back into
 * the original `Map` without causing circularity issues, achieving two-way
 * binding between both objects. See example.
 *
 * @param {String} [event="change"] - Name of event to hook up to
 * @param {Function} [callback] - Callback to invoke when event fires. If this
 *                                parameter is provided, the method will revert
 *                                to its default (non-`can.bacon`) behavior.
 *
 * @returns EventStream | `this`
 *
 * @example
 * // Binding
 * var map = new can.Map({x:1});
 * map.bind().log("map changed:");
 * map.bind("x").log("x property changed:");
 * map.attr("x", 2);
 * // map changed: {event: Object, which: "x", "how": "set", value: 2}
 * // x property changed: 2
 *
 * // Piping into a different Map
 * var map1 = new can.Map();
 * var map2 = map1.bind().toCanMap(new can.Map());
 * map1.bind().log("map1 changed:");
 * map2.bind().log("map2 changed:");
 *
 * map1.attr("x", 1);
 * // map2 changed: {event: Object, which: "x", "how": "add", value:1}
 * // map1 changed: {event: Object, which: "x", "how": "add", value:1}
 * map2.attr("x", 2);
 * // map1 changed: {event: Object, which: "x", "how": "set", value:2}
 * // map2 changed: {event: Object, which: "x", "how": "set", value:2}
 * console.log(map1.attr(), map2.attr());
 * // {x:2}, {x:2}
 */
can.Map.prototype.bind = can.bindAndSetup;
can.Map.prototype.getEventValueForBacon = function(args) {
  switch (args[0] && args[0].type) {
  case "change":
    return new MapChangeEvent(args);
  default:
    var target = args[0].target;
    if (target._data && target._data.hasOwnProperty(args[0].type)) {
      // We found a named property change event, not a generic custom event
      // (maybe, probably)
      return args[1];
    } else {
      // If we don't know what the event is, return the arguments as-is
      return args;
    }
  }
};

function MapChangeEvent(args) {
  this.event = args[0];
  this.which = args[1];
  this.how = args[2];
  this.value = args[3];
  // This isn't documented because I want to pretend it doesn't exist :)
  this.oldValue = args[4];
}

/**
 * @function can.List#bind
 *
 * Replaces the default CanJS behavior of the `can.List#bind()` method with one
 * that returns an `EventStream` of event objects or values if the `callback`
 * argument is not provided.
 *
 * The values in `EventStream` vary depending on the event being listened to.
 *
 * For named property events, the new value of the property is returned,
 * as-is. Both numerical properties (indices) and regular Map attrs can be
 * bound to.
 *
 * For the `"length"` events, the new length of the array is returned as-is.
 *
 * The rest of the events, namely `"change"`, `"add"`, `"remove"`, and `"set"`,
 * either `ListChangeEvent` or `MapChangeEvent` objects are returned from the
 * stream, depending on whether the modification involves a numerical key.

 * For events on numerical properties, `ListChangeEvent` objects are returned,
 * with the following properties:
 *
 * {
 *   event: Object // The CanJS event object.
 *   index: Integer // They initial index of the change.
 *   how: "add"|"remove"|"set" // The type of operation,
 *   value: Array | Any // For "add" events, an array of added items.
 *                         For "remove" events, an array of removed items.
 *                         For "set", the single new value.
 * }
 *
 * For events on non-numerical properties, `MapChangeEvent` objects are
 * returned, using the same structure as `can.Map#bind()`:
 *
 * {
 *   event: Object // The CanJS event object.
 *   which: String // They attr/key affected by the event,
 *   how: "add"|"remove"|"set" // The type of operation,
 *   value: Any // For "add"/"set" events, the new value. For "remove" events,
 *                 the removed value.
 * }
 *
 * Note that these objects conform to the API required for `Bacon.toCanList` and
 * `Bacon.toCanMap` respectively, so the `EventStream` returned by this function
 * can be piped into a different `can.List` or `can.Map` to synchronise both.
 *
 * Unlike the stream returned by `can.Map#bind()`, this one cannot be used for
 * two-way binding out of the box, since `add` events will bounce back and forth
 * infinitely and cause an overflow. One-way binding works fine, though, and can
 * easily handle lists of different lengths.
 *
 * @param {String} [event="change"] - Name of event to hook up to
 * @param {Function} [callback] - Callback to invoke when event fires. If this
 *                                parameter is provided, the method will revert
 *                                to its default (non-`can.bacon`) behavior.
 *
 * @returns EventStream | `this`
 *
 */
can.List.prototype.getEventValueForBacon = function(args) {
  switch (args[0] && args[0].type) {
  case "change":
  case "set":
  case "add":
  case "remove":
    return new ListChangeEvent(args);
  case "length":
    return args[1];
  default:
    // This is different from the can.Map version because can.Lists don't have
    // the _data property.
    var target = args[0].target;
    var _type = args[0].type;
    if (target.hasOwnProperty(args[0].type)) {
      // We found a named property change event, not a generic custom event
      // (maybe, probably).
      // TODO - change the semantics here to check for integers. Floats should
      // be treated as string keys.
      return isNaN(_type) ? args[1] : args[1][0];
    } else {
      // If we don't know what the event is, return the arguments as-is
      return args;
    }
  }
};

function ListChangeEvent(args) {
  this.event = args[0];
  switch (this.event.type) {
  case "change":
    // NOTE: This gets a string as the index for all change events.
    this.index = isNaN(args[1])?args[1]:+args[1];
    this.how = args[2];
    // We take the liberty of changing these semantics for remove events. Aside
    // from it being generally more convenient for filtering, this means that,
    // aside from `this.oldValue` being weird, binding to "change" and filtering
    // on `how` will give exactly equivalent results to just binding directly on
    // the specific event type.
    //
    // NOTE: when you `can.List#pop()` on an empty array, you get
    // `[undefined]` as the value, whereas splicing an empty array gets you
    // `[]` as the value.
    // See https://github.com/bitovi/canjs/issues/998
    this.value = this.how === "remove" ? args[4] : args[3];
    // This is only ever of interest for set events (we never spit out
    // ListChangeEvent for length events)
    this.oldValue = args[4];
    break;
  case "set":
  case "add":
  case "remove":
    this.index = args[2];
    this.how = this.event.type;
    // NOTE: The docs say that this can be either one, or many things. I can
    // only seem to get arrays out of this event, though.
    this.value = args[1];
    // NOTE: These events do not include oldValue.
    this.oldValue = null;
    break;
  default:
    throw new Error("Unexpected can.List event: "+this.event.type);
  }
}

function toBaconObservable(ctx, ev, selector) {
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
    return stream.toProperty(ctx());
  } else {
    return stream;
  }
};

function chooseEventData(ctx, eventArgs, evName) {
  if (ctx.isComputed) {
    return eventArgs[1];
  } else if (ctx.getEventValueForBacon) {
    return ctx.getEventValueForBacon(eventArgs, evName);
  } else {
    return [].slice.call(eventArgs);
  }
}
