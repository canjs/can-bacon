# can.bacon

`can.bacon` is [hosted at Github](http://github.com/zkat/can.bacon). `mona` is a
public domain work, dedicated using
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Feel free to do
whatever you want with it.

# Quickstart

### Install

`$ npm install cond`
or
`$ bower install cond`

### Example

Execute the following in a browser session, with developer tools open, and
follow the instructions:

```javascript

var availableFlavors = ["chocolate", "vanilla", "mint chocolate chip"];
function getIceCream(flavor) {
    if (availableFlavors.indexOf(flavor) !== -1) {
        return flavor + " ice cream ゲットー!";
    } else {
        // Just like throw new Error("something"), but we provide a way
        // the user can recover from it.
        return cond.error("Sorry, that flavor is not available", [
            "different-flavor", "Try a different flavor", getIceCream
        ], [
            "add-flavor", "Add this flavor to available ones and retry", function() {
                availableFlavors.push(flavor);
                return getIceCream(flavor);
            }
        ]);
    }
}

console.log(getIceCream("coffee"));
console.log("I really like this flavor!");

// In the console, do:

// > showRecoveries();
// > recover(0, "chocolate");

// You can also access recoveries programmatically:
console.log(cond.handlerBind(function() {
    return getIceCream("bubblegum");
}, [Error, function(e) { return cond.recover("add-flavor"); }]));
```

# Introduction

`cond` is a JavaScript implementation of
[Common Lisp's condition system](http://gigamonkeys.com/book/beyond-exception-handling-conditions-and-restarts.html),
a system for handling errors and other conditions of interest that handles
signals at the call site, before the stack is unwound -- allowing you to repair
or alter what happens at the callsite, and continuing executing as if nothing
had been signaled/thrown.
