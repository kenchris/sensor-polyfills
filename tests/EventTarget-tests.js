"use strict";

function runEventTarget_addEventListener(eventTarget) {
  test(() => {
    const target = new eventTarget();

    assert_equals(target.addEventListener("x", null, false), undefined);
    assert_equals(target.addEventListener("x", null, true), undefined);
    assert_equals(target.addEventListener("x", null), undefined);
  }, "Adding a null event listener should succeed");
}

function runEventTarget_removeEventListener(eventTarget) {
  test(() => {
    const target = new eventTarget();

    assert_equals(target.removeEventListener("x", null, false), undefined);
    assert_equals(target.removeEventListener("x", null, true), undefined);
    assert_equals(target.removeEventListener("x", null), undefined);
  }, "removing a null event listener should succeed");
}

setup({
  "allow_uncaught_exception": true,
})

function runEventTarget_dispatchEvent(testElement) {
  customElements.define('test-b', testElement);

  test(function() {
    assert_throws(new TypeError(), function() { document.dispatchEvent(null) })
  }, "Calling dispatchEvent(null).")

  var dispatch_dispatch = async_test("If the event's dispatch flag is set, an InvalidStateError must be thrown.")
  dispatch_dispatch.step(function() {
    var e = document.createEvent("Event")
    e.initEvent("type", false, false)
    var target = document.createElement("test-b");
    target.addEventListener("type", dispatch_dispatch.step_func(function() {
      assert_throws("InvalidStateError", function() {
        target.dispatchEvent(e)
      })
      assert_throws("InvalidStateError", function() {
        document.dispatchEvent(e)
      })
    }), false)
    assert_equals(target.dispatchEvent(e), true, "dispatchEvent must return true")
    dispatch_dispatch.done()
  })

  test(function() {
    // https://www.w3.org/Bugs/Public/show_bug.cgi?id=17713
    // https://www.w3.org/Bugs/Public/show_bug.cgi?id=17714
    var e = document.createEvent("Event")
    e.initEvent("type", false, false)
    var called = []
    var target = document.createElement("test-b");
    target.addEventListener("type", function() {
      called.push("First")
      throw new Error()
    }, false)
    target.addEventListener("type", function() {
      called.push("Second")
    }, false)
    assert_equals(target.dispatchEvent(e), true, "dispatchEvent must return true")
    assert_array_equals(called, ["First", "Second"],
                        "Should have continued to call other event listeners")
  }, "Exceptions from event listeners must not be propagated.")

  async_test(function() {
    var results = []
    var outerb = document.createElement("test-b")
    var middleb = outerb.appendChild(document.createElement("test-b"))
    var innerb = middleb.appendChild(document.createElement("test-b"))
    outerb.addEventListener("x", this.step_func(function() {
      middleb.addEventListener("x", this.step_func(function() {
        results.push("middle")
      }), true)
      results.push("outer")
    }), true)
    innerb.dispatchEvent(new Event("x"))
    console.log(results);
    assert_array_equals(results, ["outer", "middle"])
    this.done()
  }, "Event listeners added during dispatch should be called");

  async_test(function() {
    var results = []
    var b = document.createElement("test-b")
    b.addEventListener("x", this.step_func(function() {
      results.push(1)
    }), true)
    b.addEventListener("x", this.step_func(function() {
      results.push(2)
    }), false)
    b.addEventListener("x", this.step_func(function() {
      results.push(3)
    }), true)
    b.dispatchEvent(new Event("x"))
    assert_array_equals(results, [1, 2, 3])
    this.done()
  }, "Event listeners should be called in order of addition")

  test(function() {
    var event_type = "foo";
    var target = document.createElement("test-b");
    var parent = document.createElement("test-b");
    parent.appendChild(target);

    var default_prevented;
    parent.addEventListener(event_type, function(e) {}, true);
    target.addEventListener(event_type, function(e) {
        evt.preventDefault();
        default_prevented = evt.defaultPrevented;
    }, true);
    target.addEventListener(event_type, function(e) {}, true);
    var evt = document.createEvent("Event");
    evt.initEvent(event_type, true, true);
    assert_true(parent.dispatchEvent(evt));
    assert_false(target.dispatchEvent(evt));
    assert_true(default_prevented);
}, "Return value of EventTarget.dispatchEvent.");
}

function runEventTarget_constructible(eventTarget) {
  test(() => {
    const target = new eventTarget();
    const event = new Event("foo", { bubbles: true, cancelable: false });
    let callCount = 0;

    function listener(e) {
      assert_equals(e, event);
      ++callCount;
    }

    target.addEventListener("foo", listener);

    target.dispatchEvent(event);
    assert_equals(callCount, 1);

    target.dispatchEvent(event);
    assert_equals(callCount, 2);

    target.removeEventListener("foo", listener);
    target.dispatchEvent(event);
    assert_equals(callCount, 2);
  }, "A constructed EventTarget can be used as expected");

  test(() => {
    class NicerEventTarget extends eventTarget {
      on(...args) {
        this.addEventListener(...args);
      }

      off(...args) {
        this.removeEventListener(...args);
      }

      dispatch(type, detail) {
        this.dispatchEvent(new CustomEvent(type, { detail }));
      }
    }

    const target = new NicerEventTarget();
    const event = new Event("foo", { bubbles: true, cancelable: false });
    const detail = "some data";
    let callCount = 0;

    function listener(e) {
      assert_equals(e.detail, detail);
      ++callCount;
    }

    target.on("foo", listener);

    target.dispatch("foo", detail);
    assert_equals(callCount, 1);

    target.dispatch("foo", detail);
    assert_equals(callCount, 2);

    target.off("foo", listener);
    target.dispatch("foo", detail);
    assert_equals(callCount, 2);
  }, "EventTarget can be subclassed");
}