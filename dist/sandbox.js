var compute1 = can.compute(1),
    property1 = compute1.bind(),
    compute2 = property1.toCanCompute(),
    property2 = compute2.bind(),
    recentLimit = 5,
    recentChanges = property1.scan({count:0}, function(acc, val) {
      return {count: acc.count+1, value: val};
    }).withHandler(function(event) {
      var acc = event.value(),
          ret = this.push(new Bacon.Next({
            how: "add",
            index: Math.min(recentLimit, acc.count-1),
            value: [acc.value]
          }));
      if (acc.count > recentLimit) {
        ret = this.push(new Bacon.Next({how: "remove", index: 0}));
      }
      return ret;
    }),
    total = property2.map(1).scan(0, function(a, b) {return a+b;});

property2.onValue(compute1);

property1.log("property");
property2.log("property2");
recentChanges.log("recentChanges");
total.log("total");

var map1 = new can.Map({a:1,b:2});
var map2 = map1.bind().toCanMap();
// Super-magical happy fun time two-way binding between maps :)
map2.bind().toCanMap(map1);
map1.bind().log("map1 changed");
map2.bind().log("map2 changed");

var list1 = new can.List([1,2,3]);
var list2 = list1.bind().toCanList(new can.List([1,2,3]));
// This one doesn't work quite as well as one would hope.
// list2.bind().toCanList(list1);
list1.bind().log("list1 changed");
list2.bind().log("list2 changed");

function domStream(name) {
  return function(target) {
    return can.$(target||document).asEventStream(name);
  };
}
var Mouse = {
  mousemove: domStream("mousemove"),
  mouseup: domStream("mouseup"),
  mousedown: domStream("mousedown"),
  click: domStream("click"),
  position: function(target) {
    return Mouse.mousemove(target)
      .map(function(ev) {return [ev.pageX, ev.pageY];})
      .toProperty();
  },
  isUp: function(target) {
    return Mouse.mouseup(target).map(true)
      .merge(Mouse.mousedown(target).map(false))
      .toProperty();
  },
  isDown: function(target) {
    return Mouse.isUp(target).not();
  }
};

var Window = {
  height: function() {
    return Window.dimensions().map(".0");
  },
  width: function() {
    return Window.dimensions().map(".1");
  },
  dimensions: function() {
    var win = can.$(window);
    return win.asEventStream("resize")
      .map(function(){ return [win.outerWidth(), win.outerHeight()]; })
      .toProperty([win.outerWidth(), win.outerHeight()]);
  },
  animationFrames: function() {
    return Bacon.fromBinder(function(sink) {
      var done = false,
          requestID;
      function request() {
        requestID = window.requestAnimationFrame(function(x) {
          sink(x);
          if (!done) {request();}
        });
      }
      request();
      return function stop() {
        done = true;
        if (requestID) {
          window.cancelAnimationFrame(requestID);
        }
      };
    });
  }
};

can.Component.extend({
  tag: "drag-drop-demo",
  template: can.view("#drag-drop-demo-tpl"),
  scope: {
    clamp: true,
    boxPosition: {x: 0, y: 0}
  },
  events: {
    clampToDemo: function(box, coordinates) {
      var el = this.element;
      return [clamp(coordinates[0], 0, el.width()-box.width()),
              clamp(coordinates[1], 0, el.height()-box.height())];
    },
    mouseDeltas: function() {
      return Mouse.position().diff(null, function(a, b) {
        return a ? [b[0] - a[0], b[1] - a[1]] : [0,0];
      });
    },
    boxPosition: function(box) {
      var startPos = box.position();
      return this.mouseDeltas()
        .scan([startPos.left, startPos.top], function(a, b) {
          return [a[0]+b[0], a[1]+b[1]];
        }).map(this.scope.attr("clamp") ?
               this.clampToDemo.bind(this, box) :
               function(x){return x;});
    },
    ".draggable-box mousedown": function(box, ev) {
      var scope = this.scope,
          el = this.element,
          boxPosition = this.boxPosition(box)
            .sampledBy(Window.animationFrames())
            .takeWhile(Mouse.isDown());
      can.$("body").addClass("drag-drop-demo-dragging");
      el.trigger("dragstart");
      boxPosition.onEnd(function() {
        can.$("body").removeClass("drag-drop-demo-dragging");
        el.trigger("dragend");
      });
      boxPosition.onValue(function(coords) {
        scope.attr("boxPosition", {
          x: coords[0],
          y: coords[1]
        });
      });
    }
  }
});

function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

$("#container").html(can.view("#container-template", {
  compute1: compute1,
  compute2: compute2,
  recent: recentChanges.toCanList(),
  total: total.toCanCompute()
}));
