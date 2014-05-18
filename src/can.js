module bacon from "bacon";
module can from "can";

var oldBind = can.bind;
can.bind = function(ev, cb) {
  return cb ?
    oldBind.apply(this, arguments) :
    toBaconObservable(this, ev);
};

var oldBindAndSetup = can.bindAndSetup;
can.bindAndSetup = function(ev, cb) {
  return cb ?
    oldBindAndSetup.apply(this, arguments) :
    toBaconObservable(this, ev);
};
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
  this.oldValue = args[4];
}

// http://canjs.com/docs/can.List.prototype.attr.html#section_Events
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
    return args;
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

function toBaconObservable(ctx, ev) {
  ev = ev || "change";
  var stream = bacon.fromBinder(function(sink) {
    function cb() {
      sink(new bacon.Next(chooseEventData(ctx, arguments)));
    }
    ctx.bind(ev, cb);
    return ()=>ctx.unbind(ev, cb);
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
