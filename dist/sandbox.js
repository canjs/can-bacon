/**
 * Computes, Maps, and Lists
 *
 * Including change-event-based incremental updates with
 * manually-crafted events.
 */
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

$("#container").html(can.view("#container-template", {
  compute1: compute1,
  compute2: compute2,
  recent: recentChanges.toCanList(),
  total: total.toCanCompute()
}));

/**
 * DOM Utility "modules"
 */
function domStream(name) {
  return function(target) {
    return $(target||document).asEventStream(name);
  };
}
var Mouse = {
  mousemove: domStream("mousemove"),
  mouseup: domStream("mouseup"),
  mousedown: domStream("mousedown"),
  click: domStream("click"),
  clicks: function(target) {
    return Mouse.click(target).map(function(ev) {
      return {
        x: target ? ev.offsetX : ev.pageX,
        y: target ? ev.offsetY : ev.pageY
      };
    });
  },
  deltas: function(target) {
    return Mouse.position(target).diff(null, function(a, b) {
      return a ? {x: b.x - a.x, y: b.y - a.y} : {x: 0, y: 0};
    }).toEventStream();
  },
  position: function(target) {
    return Mouse.mousemove(target)
      .map(function(ev) {
        return {
          x: target ? ev.offsetX : ev.pageX,
          y: target ? ev.offsetY : ev.pageY
        };
      }).toProperty();
  },
  isUp: function(upTarget, downTarget) {
    return Mouse.mouseup(upTarget).map(true)
      .merge(Mouse.mousedown(downTarget).map(false))
      .toProperty();
  },
  isDown: function(downTarget, upTarget) {
    return Mouse.isUp(upTarget, downTarget).not();
  }
};

var Window = {
  height: function() {
    return Window.dimensions().map(".height");
  },
  width: function() {
    return Window.dimensions().map(".width");
  },
  dimensions: function() {
    var win = $(window);
    return win.asEventStream("resize")
      .map(function(){
        return {width: win.outerWidth(), height: win.outerHeight()};
      })
      .toProperty({width: win.outerWidth(), height: win.outerHeight()});
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

/**
 * Drag and drop component
 */
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
      return {
        x: clamp(coordinates.x, 0, el.width()-box.width()),
        y: clamp(coordinates.y, 0, el.height()-box.height())
      };
    },
    boxPosition: function(box) {
      var startPos = box.position();
      return Mouse.deltas()
        .scan({x: startPos.left, y: startPos.top}, function(a, b) {
          return {x: a.x + b.x, y: a.y + b.y};
        }).map(this.scope.attr("clamp") ?
               this.clampToDemo.bind(this, box) :
               function(x){return x;});
    },
    inserted: function() {
      var scope = this.scope,
          el = this.element,
          control = this,
          box = el.children(".draggable-box"),
          boxHeld = Mouse.isDown(box);
      boxHeld.assign(can.$("body"), "toggleClass", "drag-drop-demo-dragging");
      boxHeld.changes().filter(function(x){return x;}).onValue(function() {
        control.boxPosition(box)
          .takeWhile(boxHeld)
          .assign(scope, "attr", "boxPosition");
      });
    }
  }
});

function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

$("#container").append(can.stache("<drag-drop-demo></drag-drop-demo>")());
