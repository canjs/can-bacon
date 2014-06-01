(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("Bacon"), require("can"));
	else if(typeof define === 'function' && define.amd)
		define(["Bacon", "can"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("Bacon"), require("can")) : factory(root["Bacon"], root["can"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
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
	  if (this instanceof bacon.Observable) {
	    return this;
	  } else if (cb) {
	    return oldBind.apply(this, arguments);
	  } else {
	    return toBaconObservable(this, ev);
	  }
	};
	var oldDelegate = can.delegate;
	can.delegate = function(selector, ev, cb) {
	  if (this instanceof bacon.Observable) {
	    return this;
	  } else if (cb) {
	    return oldDelegate.apply(this, arguments);
	  } else {
	    return toBaconObservable(this, ev, selector);
	  }
	};
	var oldBindAndSetup = can.bindAndSetup;
	can.bindAndSetup = function(ev, cb) {
	  return cb ? oldBindAndSetup.apply(this, arguments) : toBaconObservable(this, ev);
	};
	var oldControlOn = can.Control.prototype.on;
	can.Control.prototype.on = function(ctx, selector, eventName, func) {
	  if (!ctx) {
	    return oldControlOn.apply(this, arguments);
	  }
	  if (ctx instanceof bacon.Observable) {
	    return ctx.takeUntil(can.bind.call(this, "destroyed"));
	  } else {
	    return oldControlOn.apply(this, arguments);
	  }
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
	function toBaconObservable(ctx, ev, selector) {
	  ev = ev == null ? "change" : ev;
	  var stream = bacon.fromBinder(function(sink) {
	    function cb() {
	      sink(new bacon.Next(chooseEventData(ctx, arguments)));
	    }
	    selector ? can.delegate.call(ctx, selector, ev, cb) : can.bind.call(ctx, ev, cb);
	    return (function() {
	      return selector ? can.undelegate.call(ctx, selector, ev, cb) : can.unbind.call(ctx, ev, cb);
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
	    return eventArgs[0];
	  }
	}
	


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __moduleName = "src/bacon";
	var bacon = __webpack_require__(3);
	var can = __webpack_require__(4);
	bacon.Observable.prototype.toCanCompute = function() {
	  var compute = arguments[0] !== (void 0) ? arguments[0] : can.compute();
	  this.onValue(compute);
	  return compute;
	};
	bacon.Observable.prototype.toCanMap = function() {
	  var map = arguments[0] !== (void 0) ? arguments[0] : new can.Map();
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
	      break;
	    case undefined:
	      console.warn("Missing event type on change event: ", val);
	      map.attr(val);
	      break;
	    default:
	      console.warn("Unexpected event type: ", val.how);
	      map.attr(val);
	  }
	}
	bacon.Observable.prototype.toCanList = function() {
	  var list = arguments[0] !== (void 0) ? arguments[0] : new can.List();
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
	        break;
	      case undefined:
	        console.warn("Missing event type on change event: ", val);
	        list.replace(val.value);
	        break;
	      default:
	        console.warn("Unexpected event type: ", val.how);
	        list.replace(val.value);
	    }
	  }
	}
	


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_3__;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_4__;

/***/ }
/******/ ])
})

//# sourceMappingURL=can.bacon.js.map