// Globals allowed by JSHint:
/*global
  QUnit: false,
  test: false,
  equal: false,
  ok: false
*/


(function(){
  "use strict";

  $.i18n.properties({
    name: 'messages',
    path: 'fixtures/',
    language: 'en_GB',
    fallback: 'fr'
  });

  test("initilaization with $.i18n.properties", function() {
    equal(Object.keys($.i18n.map).length, 9, "the primary map should be a collection of unique keys in en and en_GB");
    equal(Object.keys($.i18n.fallbackMap).length, 0, "the fallback map should net yet be loaded");
    equal($.i18n.map.police_man, 'bobby', "the locale_COUNTRY file should override the base locale file");
    equal($.i18n.map.plain_text, 'this is a value.', "the base locale file entries should still be available if they are unique");
  });

  test ("plain text translation", function() {
    equal($.i18n.prop('plain_text'), 'this is a value.', "should be plain, uninterpolated text");
    equal($.i18n.prop('plain_text', ['a']), 'this is a value.', "should be plain, uninterpolated text");
    equal($.i18n.prop('trim_test'), 'that space intentionally left blank.', "key and value should be trimmed properly");
    equal($.i18n.prop('double_equal'), 'this value has another = sign in it.', "value should be allowed to contain equals signs");
    equal($.i18n.prop('police_man'), 'bobby', "the base locale should be overridden by the country specific file") ;
  });

  test ("placeholders", function() {
    ok(typeof($.i18n.map.placeholder_text === 'string'), "value in map should start as a regular string");
    equal($.i18n.prop('placeholder_text', ['a', 'b']), 'this is a value with b.', "should be interpolated properly via prop");
    ok($.isArray($.i18n.map.placeholder_text), "value in map should now be tokenized");
    equal($.i18n.prop('placeholder_text', ['x', 'z']), 'this is x value with z.', "should be interpolated properly via the token array");
  });

  test ("escape sequences", function() {
    equal($.i18n.prop('backslash'), 'this has a backslash \\ in it.', "double backslash should be escaped to single");
    equal($.i18n.prop('double'), 'this has a double backslash \\\\ in it.', "quadruple backslash should be escaped to double");
    equal($.i18n.prop('escaped_placeholder', ['foo']), 'this is a literal {0}.', "backslash should allow literal tokens in output without replacement");
  });

  test ("fallback translations", function() {
    equal($.i18n.prop('fallback'), 'repli charge', "should fall back when the translation is not available in the primary map");
  });

  test ("options hash", function() {
    equal($.i18n.prop('foo', { allowNull: true }), null, "should return null for non-existent keys when allowNull is true");
    equal($.i18n.prop('foo', ['bar'], { allowNull: true }), null, "should return null for non-existent keys even when placeholder values are passed as long as allowNull is true");
    equal($.i18n.prop('foo', null, { allowNull: true }), null, "should return null for non-existent keys even when placeholder values are passed as null as long as allowNull is true");
  });

  QUnit.start();
})();

