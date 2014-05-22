(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("Bacon"), require("can"));
	else if(typeof define === 'function' && define.amd)
		define(["Bacon", "can"], factory);
	else if(typeof exports === 'object')
		exports["can.bacon"] = factory(require("Bacon"), require("can"));
	else
		root["can.bacon"] = factory(root["Bacon"], root["can"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_4__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/ 		
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/ 		
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 		
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 		
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/ 	
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/ 	
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/ 	
/******/ 	
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __moduleName = "src/index";
	__webpack_require__(1);
	__webpack_require__(2);
	


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __moduleName = "src/can";
	var bacon = __webpack_require__(3);
	var can = __webpack_require__(4);
	var oldBind = can.bind;
	can.bind = function(ev, cb) {
	  return cb ? oldBind.apply(this, arguments) : toBaconObservable(this, ev);
	};
	var oldBindAndSetup = can.bindAndSetup;
	can.bindAndSetup = function(ev, cb) {
	  return cb ? oldBindAndSetup.apply(this, arguments) : toBaconObservable(this, ev);
	};
	can.Map.prototype.bind = can.bindAndSetup;
	can.Map.prototype.getEventValueForBacon = function(args) {
	  switch (args[0] && args[0].type) {
	    case "change":
	      return new MapChangeEvent(args);
	    default:
	      var target = args[0].target;
	      if (target._data && target._data.hasOwnProperty(args[0].type)) {
	        return args[1];
	      } else {
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
	      var target = args[0].target;
	      var _type = args[0].type;
	      if (target.hasOwnProperty(args[0].type)) {
	        return isNaN(_type) ? args[1] : args[1][0];
	      } else {
	        return args;
	      }
	  }
	};
	function ListChangeEvent(args) {
	  this.event = args[0];
	  switch (this.event.type) {
	    case "change":
	      this.index = isNaN(args[1]) ? args[1] : +args[1];
	      this.how = args[2];
	      this.value = this.how === "remove" ? args[4] : args[3];
	      this.oldValue = args[4];
	      break;
	    case "set":
	    case "add":
	    case "remove":
	      this.index = args[2];
	      this.how = this.event.type;
	      this.value = args[1];
	      this.oldValue = null;
	      break;
	    default:
	      throw new Error("Unexpected can.List event: " + this.event.type);
	  }
	}
	function toBaconObservable(ctx, ev) {
	  ev = ev == null ? "change" : ev;
	  var stream = bacon.fromBinder(function(sink) {
	    function cb() {
	      sink(new bacon.Next(chooseEventData(ctx, arguments)));
	    }
	    ctx.bind(ev, cb);
	    return (function() {
	      return ctx.unbind(ev, cb);
	    });
	  });
	  if (ctx.isComputed) {
	    return stream.toProperty(ctx());
	  } else {
	    return stream;
	  }
	}
	;
	function chooseEventData(ctx, eventArgs, evName) {
	  if (ctx.isComputed) {
	    return eventArgs[1];
	  } else if (ctx.getEventValueForBacon) {
	    return ctx.getEventValueForBacon(eventArgs, evName);
	  } else {
	    return [].slice.call(eventArgs);
	  }
	}
	


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __moduleName = "src/bacon";
	var bacon = __webpack_require__(3);
	var can = __webpack_require__(4);
	bacon.Observable.prototype.toCanCompute = function(compute) {
	  compute = compute || can.compute();
	  this.onValue(compute);
	  return compute;
	};
	bacon.Observable.prototype.toCanMap = function(map) {
	  map = map || new can.Map();
	  this.onValue((function(val) {
	    return syncAsMap(map, val);
	  }));
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
	      map.attr(val);
	  }
	}
	bacon.Observable.prototype.toCanList = function(list) {
	  list = list || new can.List();
	  this.onValue((function(val) {
	    return syncAsList(list, val);
	  }));
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
	        list.splice.apply(list, [val.index, 0].concat(val.value));
	        break;
	      case "remove":
	        list.splice(Math.min(val.index, !list.length ? 0 : list.length - 1), val.value ? val.value.length : 1);
	        break;
	      case "replace":
	        if (val.hasOwnProperty("removeOthers")) {
	          list.attr(val.value, val.removeOthers);
	        } else {
	          list.replace(val.value);
	        }
	      default:
	        console.warn("Unexpected event type: ", val.how);
	        list.replace(val.value);
	    }
	  }
	}
	


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = Bacon;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = can;

/***/ }
/******/ ])
})

//# sourceMappingURL=can.bacon.js.map