module bacon from "bacon";
module can from "can";

/**
 * Returns a `can.compute` whose value changes whenever `observable`'s value
 * changes. If a compute is provided, it will be used instead of creating a new
 * one.
 */
bacon.Observable.prototype.toCanCompute = function(compute) {
  compute = compute || can.compute();
  this.onValue(compute);
  return compute;
};

/**
 * Returns a `can.Map` whose value is managed by a stream of incoming map change
 * events.
 *
 * If `map` is provided, it *must* be a `can.Map` instance, which will be used
 * instead of creating a new empty `can.Map`.
 *
 * Two kinds of event objects are accepted:
 *
 * @example
 * // Modification event. Modifies a single key.
 * {
 *   how: "set"|"add"|"remove", // The type of operation.
 *   which: String, // The key to modify.
 *   value: Any, // The value to set. Optional for `remove`.
 * }
 *
 * // Replacement event. Uses `.attr()` to replace multiple keys.
 * {
 *   how: "replace", // Must be this string.
 *   value: Object, // Object to replace with.
 *   removeOthers: Boolean // Passed to `.attr()`. See http://canjs.com/docs/can.Map.prototype.attr.html#sig_map_attr_obj__removeOthers__
 * }
 */
bacon.Observable.prototype.toCanMap = function(map) {
  map = map || new can.Map();
  this.onValue((val)=>syncAsMap(map, val));
  return map;
};

function syncAsMap(map, val) {
  var key = val.hasOwnProperty("which") ? val.which : val.index;
  switch (val.how) {
  case "set":
    map.attr(key, val.value);
    break;
  case "add":
    map.attr(key, val.value);
    break;
  case "remove":
    map.removeAttr(key);
    break;
  case "replace":
    map.attr(val.value, val.removeOthers);
  default:
    console.warn("Unexpected event type: ", val.how);
    // idk you're giving it to me so I'll shove it in. It's your own fault
    // if it breaks. You voided the warranty. Be thankful for the log :)
    map.attr(val);
  }
}

/**
 * Returns a `can.List` whose value is managed by a stream of incoming list
 * and/or map change events.
 *
 * If `list` is provided, it *must* be a `can.List` instance, which will be used
 * instead of creating a new empty instance.
 *
 * Three kinds of event objects are accepted:
 *
 * @example
 * // Modification event. Modifies a single index or key.
 * {
 *   how: "set"|"add"|"remove", // The type of operation.
 *   which: String|Integer, // The key to modify.
 *   value: Any, // The value to set. For "add" on an Integer index, must be an
 *                  Array-like. Optional for `remove`.
 * }
 *
 * // Replacement event. Calls `.replace()`
 * {
 *   how: "replace", // Must be this string.
 *   value: Array-like, // Array-like to replace contents with.
 *   removeOthers: Boolean=true (optional) // Whether to keep trailing elements
 *                                            after value has been applied. If
 *                                            this argument is provided, the
 *                                            list will be replaced using
 *                                            `.attr()`. Otherwise, `.replace()`
 *                                            will be used. See:
 *                                            http://canjs.com/docs/can.List.prototype.attr.html#sig_list_attr_elements__replaceCompletely__
 * }
 */
bacon.Observable.prototype.toCanList = function(list) {
  list = list || new can.List();
  this.onValue((val)=>syncAsList(list, val));
  return list;
};

function syncAsList(list, val) {
  var isMapEvent = val.hasOwnProperty("which") || isNaN(val.index);
  if (isMapEvent && val.how !== "replace") {
    syncAsMap(list, val);
  } else {
    switch (val.how) {
    case "set":
      list.attr(val.index, val.value);
      break;
    case "add":
      // TODO - tag lists and/or events with some magical number (like.. a
      // batchnum-style thing) to prevent circular additions when two-way
      // binding. Please name it: "___PRAISE_THE_SUN___"
      list.splice.apply(list, [val.index, 0].concat(val.value));
      break;
    case "remove":
      list.splice(Math.min(val.index, !list.length?0:list.length-1),
                  val.value ? val.value.length : 1);
      break;
    case "replace":
      if (val.hasOwnProperty("removeOthers")) {
        list.attr(val.value, val.removeOthers);
      } else {
        list.replace(val.value);
      }
    default:
      console.warn("Unexpected event type: ", val.how);
      // idk you're giving it to me so I'll shove it in. It's your own fault
      // if it breaks. You voided the warranty. Be thankful for the log :)
      list.replace(val.value);
    }
  }
}
