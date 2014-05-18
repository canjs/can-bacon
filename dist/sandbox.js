var compute1 = can.compute(1),
    property1 = compute1.bind(),
    compute2 = property1.toCanCompute(),
    property2 = compute2.bind(),
    recent = property1.slidingWindow(15),
    total = property2.map(1).scan(0, function(a, b) {return a+b;});

property2.onValue(compute1);

property1.log("property");
property2.log("property2");
recent.log("recent");
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
list2.bind().toCanList(list1);
list1.bind().log("list1 changed");
list2.bind().log("list2 changed");

$("#container").html(can.view("#container-template", {
  compute1: compute1,
  compute2: compute2,
  recent: recent.toCanCompute(),
  total: total.toCanCompute()
}));
