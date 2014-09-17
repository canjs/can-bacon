/**
 * Computes, Maps, and Lists
 *
 * Including change-event-based incremental updates with
 * manually-crafted events.
 */
var compute1 = can.compute(1),
    property1 = compute1.bind(),
    compute2 = property1.toCompute(),
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
var map2 = map1.bind().toMap();
// Super-magical happy fun time two-way binding between maps :)
map2.bind().toMap(map1);
map1.bind().log("map1 changed");
map2.bind().log("map2 changed");

var list1 = new can.List([1,2,3]);
var list2 = list1.bind().toList(new can.List([1,2,3]));
// This one doesn't work quite as well as one would hope.
// list2.bind().toList(list1);
list1.bind().log("list1 changed");
list2.bind().log("list2 changed");

$("#container").html(can.view("#container-template", {
  compute1: compute1,
  compute2: compute2,
  recent: recentChanges.toList(),
  total: total.toCompute()
}));

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
        x: Math.round(clamp(coordinates.x, 0, el.width()-box.width())),
        y: Math.round(clamp(coordinates.y, 0, el.height()-box.height()))
      };
    },
    boxPosition: function(box) {
      var startPos = box.position(),
          that = this;
      return that.on(Bacon.Browser.Mouse.deltas())
        .scan({x: startPos.left, y: startPos.top}, function(a, b) {
          return {x: a.x + b.x, y: a.y + b.y};
        }).map(function(coords) {
          return that.scope.attr("clamp") ?
            that.clampToDemo(box, coords) :
            coords;
        });
    },
    inserted: function() {
      var scope = this.scope,
          el = this.element,
          control = this,
          box = el.children(".draggable-box"),
          // this.on() makes listening to observables memory-safe.
          boxHeld = this.on(Bacon.Browser.Mouse.isHeld(box)).log("box being held");
      boxHeld.assign(can.$("body"), "toggleClass", "drag-drop-demo-dragging");
      boxHeld.filter(boxHeld).onValue(function(isHeld) {
        control.boxPosition(box)
          .takeWhile(boxHeld)
          .log("box being dragged")
          .assign(scope, "attr", "boxPosition");
      });
    },
    // Still have access to templated stuff, but why bother? :)
    ".draggable-box click": function() { console.log("box clicked"); }
  }
});

function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

$("#container").append(can.stache("<drag-drop-demo></drag-drop-demo>")());
