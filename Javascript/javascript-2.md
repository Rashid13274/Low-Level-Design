## Understanding the `this` Keyword in JavaScript

The `this` keyword refers to the object that the function is a property of. Its value always depends on the object that is invoking the function.

---

### Example 1: `this` in the Global Context

```javascript
function doSomething() {
    console.log(this);
}

doSomething();
```

- When the function is invoked in the global context, `this` refers to the global object (`window` in browsers).

---

### Example 2: `this` as a Property of an Object

```javascript
var obj = {
    name: "vivek",
    getName: function() {
        console.log(this.name);
    }
};

obj.getName();
```

- Here, `getName` is a property of `obj`, so `this` refers to `obj`.
- **Output:** `"vivek"`


<!-- ============================================================================================ -->



