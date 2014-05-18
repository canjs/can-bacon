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
  if (args.length === 2 || args.length === 3) {
    return args[1];
  } else if (args.length === 5) {
    return new MapEvent(args);
  } else {
    console.warn("Unexpected event shape: ", args);
    return new MapEvent(args);
  }
};

function MapEvent(args) {
  this.type = args[0].type;
  this.batchNum = args[0].batchNum;
  this.target = args[0].target;
  this.verb = args[1];
  this.value = args[2];
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
