"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Int64 = require("node-int64");
const Int64Test_types_1 = require("./gen-js/Int64Test_types");
if (typeof QUnit.log == 'function') {
    QUnit.log(function (details) {
        if (!details.result) {
            console.log('======== FAIL ========');
            console.log('TestName: ' + details.name);
            if (details.message)
                console.log(details.message);
            console.log('Expected: ' + details.expected);
            console.log('Actual  : ' + details.actual);
            console.log('======================');
        }
    });
}
QUnit.module('Int64');
QUnit.test('Int64', function (assert) {
    console.log('Int64 test -- starts');
    const EXPECTED_SMALL_INT64_AS_NUMBER = 42;
    const EXPECTED_SMALL_INT64 = new Int64(42);
    const EXPECTED_MAX_JS_SAFE_INT64 = new Int64(Number.MAX_SAFE_INTEGER);
    const EXPECTED_MIN_JS_SAFE_INT64 = new Int64(Number.MIN_SAFE_INTEGER);
    const EXPECTED_MAX_JS_SAFE_PLUS_ONE_INT64 = new Int64("0020000000000000");
    const EXPECTED_MIN_JS_SAFE_MINUS_ONE_INT64 = new Int64("ffe0000000000000");
    const EXPECTED_MAX_SIGNED_INT64 = new Int64("7fffffffffffffff");
    const EXPECTED_MIN_SIGNED_INT64 = new Int64("8000000000000000");
    const EXPECTED_INT64_LIST = [
        EXPECTED_SMALL_INT64,
        EXPECTED_MAX_JS_SAFE_INT64,
        EXPECTED_MIN_JS_SAFE_INT64,
        EXPECTED_MAX_JS_SAFE_PLUS_ONE_INT64,
        EXPECTED_MIN_JS_SAFE_MINUS_ONE_INT64,
        EXPECTED_MAX_SIGNED_INT64,
        EXPECTED_MIN_SIGNED_INT64
    ];
    assert.ok(EXPECTED_SMALL_INT64.equals(Int64Test_types_1.Int64Test.SMALL_INT64));
    assert.ok(EXPECTED_MAX_JS_SAFE_INT64.equals(Int64Test_types_1.Int64Test.MAX_JS_SAFE_INT64));
    assert.ok(EXPECTED_MIN_JS_SAFE_INT64.equals(Int64Test_types_1.Int64Test.MIN_JS_SAFE_INT64));
    assert.ok(EXPECTED_MAX_JS_SAFE_PLUS_ONE_INT64.equals(Int64Test_types_1.Int64Test.MAX_JS_SAFE_PLUS_ONE_INT64));
    assert.ok(EXPECTED_MIN_JS_SAFE_MINUS_ONE_INT64.equals(Int64Test_types_1.Int64Test.MIN_JS_SAFE_MINUS_ONE_INT64));
    assert.ok(EXPECTED_MAX_SIGNED_INT64.equals(Int64Test_types_1.Int64Test.MAX_SIGNED_INT64));
    assert.ok(EXPECTED_MIN_SIGNED_INT64.equals(Int64Test_types_1.Int64Test.MIN_SIGNED_INT64));
    assert.equal(EXPECTED_SMALL_INT64_AS_NUMBER, Int64Test_types_1.Int64Test.SMALL_INT64.toNumber());
    assert.equal(Number.MAX_SAFE_INTEGER, Int64Test_types_1.Int64Test.MAX_JS_SAFE_INT64.toNumber());
    assert.equal(Number.MIN_SAFE_INTEGER, Int64Test_types_1.Int64Test.MIN_JS_SAFE_INT64.toNumber());
    for (let i = 0; i < EXPECTED_INT64_LIST.length; ++i) {
        assert.ok(EXPECTED_INT64_LIST[i].equals(Int64Test_types_1.Int64Test.INT64_LIST[i]));
    }
    console.log('Int64 test -- ends');
});
