"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ThriftTest_types_1 = require("./gen-js/ThriftTest_types");
require("./gen-js/ThriftTest");
var Int64 = require("node-int64");
var JSONInt64 = require("json-int64");
var QUnit = require("./qunit");
const transport = new Thrift.Transport("/service");
const protocol = new Thrift.Protocol(transport);
const client = new ThriftTest_types_1.ThriftTest.ThriftTestClient(protocol);
const int64_2_pow_60 = new Int64('1000000000000000');
const int64_minus_2_pow_60 = new Int64('f000000000000000');
if (typeof QUnit.log == 'function') {
    QUnit.log(function (details) {
        if (!details.result) {
            console.log('======== FAIL ========');
            console.log('TestName: ' + details.name);
            if (details.message)
                console.log(details.message);
            console.log('Expected: ' + JSONInt64.stringify(details.expected));
            console.log('Actual  : ' + JSONInt64.stringify(details.actual));
            console.log('======================');
        }
    });
}
const stringTest = "Afrikaans, Alemannisch, Aragonés, العربية, مصرى, Asturianu, Aymar aru, Azərbaycan, Башҡорт, Boarisch, Žemaitėška, Беларуская, Беларуская (тарашкевіца), Български, Bamanankan, বাংলা, Brezhoneg, Bosanski, Català, Mìng-dĕ̤ng-ngṳ̄, Нохчийн, Cebuano, ᏣᎳᎩ, Česky, Словѣ́ньскъ / ⰔⰎⰑⰂⰡⰐⰠⰔⰍⰟ, Чӑвашла, Cymraeg, Dansk, Zazaki, ދިވެހިބަސް, Ελληνικά, Emiliàn e rumagnòl, English, Esperanto, Español, Eesti, Euskara, فارسی, Suomi, Võro, Føroyskt, Français, Arpetan, Furlan, Frysk, Gaeilge, 贛語, Gàidhlig, Galego, Avañe'ẽ, ગુજરાતી, Gaelg, עברית, हिन्दी, Fiji Hindi, Hrvatski, Kreyòl ayisyen, Magyar, Հայերեն, Interlingua, Bahasa Indonesia, Ilokano, Ido, Íslenska, Italiano, 日本語, Lojban, Basa Jawa, ქართული, Kongo, Kalaallisut, ಕನ್ನಡ, 한국어, Къарачай-Малкъар, Ripoarisch, Kurdî, Коми, Kernewek, Кыргызча, Latina, Ladino, Lëtzebuergesch, Limburgs, Lingála, ລາວ, Lietuvių, Latviešu, Basa Banyumasan, Malagasy, Македонски, മലയാളം, मराठी, Bahasa Melayu, مازِرونی, Nnapulitano, Nedersaksisch, नेपाल भाषा, Nederlands, ‪Norsk (nynorsk)‬, ‪Norsk (bokmål)‬, Nouormand, Diné bizaad, Occitan, Иронау, Papiamentu, Deitsch, Norfuk / Pitkern, Polski, پنجابی, پښتو, Português, Runa Simi, Rumantsch, Romani, Română, Русский, Саха тыла, Sardu, Sicilianu, Scots, Sámegiella, Simple English, Slovenčina, Slovenščina, Српски / Srpski, Seeltersk, Svenska, Kiswahili, தமிழ், తెలుగు, Тоҷикӣ, ไทย, Türkmençe, Tagalog, Türkçe, Татарча/Tatarça, Українська, اردو, Tiếng Việt, Volapük, Walon, Winaray, 吴语, isiXhosa, ייִדיש, Yorùbá, Zeêuws, 中文, Bân-lâm-gú, 粵語";
function checkRecursively(assert, map1, map2) {
    if (typeof map1 !== 'function' && typeof map2 !== 'function') {
        if (!map1 || typeof map1 !== 'object') {
            assert.equal(map1, map2);
        }
        else {
            for (let key in map1) {
                checkRecursively(assert, map1[key], map2[key]);
            }
        }
    }
}
QUnit.module('Base Types');
QUnit.test('Void', function (assert) {
    assert.equal(client.testVoid(), undefined);
});
QUnit.test('Binary (String)', function (assert) {
    let binary = '';
    for (let v = 255; v >= 0; --v) {
        binary += String.fromCharCode(v);
    }
    assert.equal(client.testBinary(binary), binary);
});
QUnit.test('Binary (Uint8Array)', function (assert) {
    let binary = '';
    for (let v = 255; v >= 0; --v) {
        binary += String.fromCharCode(v);
    }
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; ++i) {
        arr[i] = binary[i].charCodeAt(0);
    }
    const hexEncodedString = Array.from(arr, function (byte) {
        return String.fromCharCode(byte);
    }).join('');
    assert.equal(client.testBinary(hexEncodedString), binary);
});
QUnit.test('String', function (assert) {
    assert.equal(client.testString(''), '');
    assert.equal(client.testString(stringTest), stringTest);
    const specialCharacters = 'quote: \" backslash:' +
        ' forwardslash-escaped: \/ ' +
        ' backspace: \b formfeed: \f newline: \n return: \r tab: ' +
        ' now-all-of-them-together: "\\\/\b\n\r\t' +
        ' now-a-bunch-of-junk: !@#$%&()(&%$#{}{}<><><';
    assert.equal(client.testString(specialCharacters), specialCharacters);
});
QUnit.test('Double', function (assert) {
    assert.equal(client.testDouble(0), 0);
    assert.equal(client.testDouble(-1), -1);
    assert.equal(client.testDouble(3.14), 3.14);
    assert.equal(client.testDouble(Math.pow(2, 60)), Math.pow(2, 60));
});
QUnit.test('Byte', function (assert) {
    assert.equal(client.testByte(0), 0);
    assert.equal(client.testByte(0x01), 0x01);
});
QUnit.test('I32', function (assert) {
    assert.equal(client.testI32(0), 0);
    assert.equal(client.testI32(Math.pow(2, 30)), Math.pow(2, 30));
    assert.equal(client.testI32(-Math.pow(2, 30)), -Math.pow(2, 30));
});
QUnit.test('I64', function (assert) {
    assert.equal(client.testI64(new Int64(0)), 0);
    let int64_2_pow_60_result = client.testI64(int64_2_pow_60);
    assert.ok(int64_2_pow_60.equals(int64_2_pow_60_result));
    let int64_minus_2_pow_60_result = client.testI64(int64_minus_2_pow_60);
    assert.ok(int64_minus_2_pow_60.equals(int64_minus_2_pow_60_result));
});
QUnit.module('Structured Types');
QUnit.test('Struct', function (assert) {
    const structTestInput = new ThriftTest_types_1.ThriftTest.Xtruct();
    structTestInput.string_thing = 'worked';
    structTestInput.byte_thing = 0x01;
    structTestInput.i32_thing = Math.pow(2, 30);
    structTestInput.i64_thing = int64_2_pow_60;
    const structTestOutput = client.testStruct(structTestInput);
    assert.equal(structTestOutput.string_thing, structTestInput.string_thing);
    assert.equal(structTestOutput.byte_thing, structTestInput.byte_thing);
    assert.equal(structTestOutput.i32_thing, structTestInput.i32_thing);
    assert.ok(structTestOutput.i64_thing.equals(structTestInput.i64_thing));
    assert.ok(structTestInput.i64_thing.equals(structTestOutput.i64_thing));
    assert.equal(JSONInt64.stringify(structTestOutput), JSONInt64.stringify(structTestInput));
});
QUnit.test('Nest', function (assert) {
    const xtrTestInput = new ThriftTest_types_1.ThriftTest.Xtruct();
    xtrTestInput.string_thing = 'worked';
    xtrTestInput.byte_thing = 0x01;
    xtrTestInput.i32_thing = Math.pow(2, 30);
    xtrTestInput.i64_thing = int64_2_pow_60;
    const nestTestInput = new ThriftTest_types_1.ThriftTest.Xtruct2();
    nestTestInput.byte_thing = 0x02;
    nestTestInput.struct_thing = xtrTestInput;
    nestTestInput.i32_thing = Math.pow(2, 15);
    const nestTestOutput = client.testNest(nestTestInput);
    assert.equal(nestTestOutput.byte_thing, nestTestInput.byte_thing);
    assert.equal(nestTestOutput.struct_thing.string_thing, nestTestInput.struct_thing.string_thing);
    assert.equal(nestTestOutput.struct_thing.byte_thing, nestTestInput.struct_thing.byte_thing);
    assert.equal(nestTestOutput.struct_thing.i32_thing, nestTestInput.struct_thing.i32_thing);
    assert.ok(nestTestOutput.struct_thing.i64_thing.equals(nestTestInput.struct_thing.i64_thing));
    assert.equal(nestTestOutput.i32_thing, nestTestInput.i32_thing);
    assert.equal(JSONInt64.stringify(nestTestOutput), JSONInt64.stringify(nestTestInput));
});
QUnit.test('Map', function (assert) {
    const mapTestInput = { 7: 77, 8: 88, 9: 99 };
    const mapTestOutput = client.testMap(mapTestInput);
    for (let key in mapTestOutput) {
        assert.equal(mapTestOutput[key], mapTestInput[key]);
    }
});
QUnit.test('StringMap', function (assert) {
    const mapTestInput = {
        'a': '123', 'a b': 'with spaces ', 'same': 'same', '0': 'numeric key',
        'longValue': stringTest, stringTest: 'long key'
    };
    const mapTestOutput = client.testStringMap(mapTestInput);
    for (let key in mapTestOutput) {
        assert.equal(mapTestOutput[key], mapTestInput[key]);
    }
});
QUnit.test('Set', function (assert) {
    const setTestInput = [1, 2, 3];
    assert.ok(client.testSet(setTestInput), setTestInput);
});
QUnit.test('List', function (assert) {
    const listTestInput = [1, 2, 3];
    assert.ok(client.testList(listTestInput), listTestInput);
});
QUnit.test('Enum', function (assert) {
    assert.equal(client.testEnum(ThriftTest_types_1.ThriftTest.Numberz.ONE), ThriftTest_types_1.ThriftTest.Numberz.ONE);
});
QUnit.test('TypeDef', function (assert) {
    assert.equal(client.testTypedef(new Int64(69)), 69);
});
QUnit.module('deeper!');
QUnit.test('MapMap', function (assert) {
    const mapMapTestExpectedResult = {
        '4': { '1': 1, '2': 2, '3': 3, '4': 4 },
        '-4': { '-4': -4, '-3': -3, '-2': -2, '-1': -1 }
    };
    const mapMapTestOutput = client.testMapMap(1);
    for (let key in mapMapTestOutput) {
        for (let key2 in mapMapTestOutput[key]) {
            assert.equal(mapMapTestOutput[key][key2], mapMapTestExpectedResult[key][key2]);
        }
    }
    checkRecursively(assert, mapMapTestOutput, mapMapTestExpectedResult);
});
QUnit.module('Exception');
QUnit.test('Xception', function (assert) {
    assert.expect(2);
    const done = assert.async();
    try {
        client.testException('Xception');
        assert.ok(false);
    }
    catch (e) {
        assert.equal(e.errorCode, 1001);
        assert.equal(e.message, 'Xception');
        done();
    }
});
QUnit.test('no Exception', function (assert) {
    assert.expect(1);
    try {
        client.testException('no Exception');
        assert.ok(true);
    }
    catch (e) {
        assert.ok(false);
    }
});
QUnit.test('TException', function (assert) {
    assert.expect(1);
    try {
        client.testException('TException');
    }
    catch (e) {
    }
    assert.ok(true);
});
QUnit.module('Insanity');
const crazy = {
    'userMap': { '5': new Int64(5), '8': new Int64(8) },
    'xtructs': [{
            'string_thing': 'Goodbye4',
            'byte_thing': 4,
            'i32_thing': 4,
            'i64_thing': new Int64(4)
        },
        {
            'string_thing': 'Hello2',
            'byte_thing': 2,
            'i32_thing': 2,
            'i64_thing': new Int64(2)
        }]
};
QUnit.test('testInsanity', function (assert) {
    const insanity = {
        '1': {
            '2': crazy,
            '3': crazy
        },
        '2': { '6': new ThriftTest_types_1.ThriftTest.Insanity() }
    };
    const res = client.testInsanity(new ThriftTest_types_1.ThriftTest.Insanity(crazy));
    assert.ok(res, JSONInt64.stringify(res));
    assert.ok(insanity, JSONInt64.stringify(insanity));
    checkRecursively(assert, res, insanity);
});
QUnit.module('Async');
QUnit.test('Double', function (assert) {
    assert.expect(1);
    const done = assert.async();
    client.testDouble(3.14159265, function (result) {
        assert.equal(result, 3.14159265);
        done();
    });
});
QUnit.test('Byte', function (assert) {
    assert.expect(1);
    const done = assert.async();
    client.testByte(0x01, function (result) {
        assert.equal(result, 0x01);
        done();
    });
});
QUnit.test('I32', function (assert) {
    assert.expect(2);
    const done = assert.async(2);
    client.testI32(Math.pow(2, 30), function (result) {
        assert.equal(result, Math.pow(2, 30));
        done();
    });
    client.testI32(Math.pow(-2, 31), function (result) {
        assert.equal(result, Math.pow(-2, 31));
        done();
    });
});
QUnit.test('I64', function (assert) {
    assert.expect(2);
    const done = assert.async(2);
    client.testI64(int64_2_pow_60, function (result) {
        assert.ok(int64_2_pow_60.equals(result));
        done();
    });
    client.testI64(int64_minus_2_pow_60, function (result) {
        assert.ok(int64_minus_2_pow_60.equals(result));
        done();
    });
});
