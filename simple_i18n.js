/**
 * simple-i18n
 *
 * Based on the seemingly-abandoned jquery-i18n-properties library, which is
 * dual licensed under the GPL and MIT licenses.
 *
 * A good number of simplifications and improvements have been made to the
 * original library. Here are the major differences that are evident in
 * functionality/api:
 *
 * * simple-i18n does not load a base translation. Instead it has the notion of
 *   a fallback translation (en by default) that will be loaded only when a key
 *   is not found in the translations already loaded (fewer network round trips
 *   and less bandwidth).
 *
 * * simple-i18n does not support passing an array of file names to be loaded.
 *   This is for simplicity and because we don't currently have a need for that.
 *
 * * simple-i18n supports only the 'map' mode where key values are loaded into
 *   a map rather than eval'd as variables. This allows us to lose a bunch
 *   of code and ditch the call to eval.
 *
 * * simple-i18n uses the backslash character for escapes, rather than
 *   apostraphe. This was done mostly to reserve the character for future use,
 *   but can be used to include literal {0} in strings by escaping placeholder
 *   digits like: {\0}
 *
 * * simple-i18n does not fall back to browser locale. The locale available to
 *   JS is not as robust as that sent to the server via the accepts-language
 *   header.
 *
 * * simple-i18n does not support passing interpolation parameters as
 *   additional arguments to the `prop` function. This mode required converting
 *   `arguments` to an array, which is costly when done hundreds/thousands of
 *   times.
 *
 * * simple-i18n parses properties file much faster. In moderns browsers,
 *   jquery-i18n properties is ~75% slower in parsing a single file.
 *
 * * simple-i18n WORKS in IE7.
 *
 * * simple-i18n does not attempt to disable properties file caching by default.
 *
 * * simple-i18n does not support multiline values
 *
 * * simple-i18n does not override String.prototype.split!
 *
 * * simple-i18n accepts an options hash on the prop method.
 *
 * v 1.0.1
 */
(function($) {
  "use strict";

  /** @namespace */
  $.i18n = {};
  $.i18n.map = {};
  $.i18n.loaded = [];
  $.i18n.fallbackMap = {};

  /**
   * Load and parse properties files, making translations available as key/value pairs.
   *
   * i18n files are named <name>_<language>.properties or <name>_<language>_<country>.properties
   * Where:
   *      The <language> argument is a valid ISO Language Code. These codes are the lower-case,
   *      two-letter codes as defined by ISO-639. You can find a full list of these codes at a
   *      number of sites, such as: http://www.loc.gov/standards/iso639-2/englangn.html
   *      The <country> argument is a valid ISO Country Code. These codes are the upper-case,
   *      two-letter codes as defined by ISO-3166. You can find a full list of these codes at a
   *      number of sites, such as: http://www.iso.ch/iso/en/prods-services/iso3166ma/02iso-3166-code-lists/list-en1.html
   *
   * Sample usage for a bundles/Messages.properties bundle:
   * $.i18n.properties({
   *      name:      'Messages',
   *      language:  'en_US',
   *      path:      'bundles'
   * });
   * @param  name     (string, optional) base name of file to load
   * @param  language (string, optional) language/country code (eg, 'en', 'en_US', 'pt_PT'). if not specified, language set to 'en'.
   * @param  fallback (string, optional) language/country code (eg, 'en', 'en_US', 'pt_PT') to be used as the base/fallback.
   * @param  path     (string, optional) path of directory that contains file to load
   * @param  cache    (boolean, optional) whether bundles should be cached by the browser, or forcibly reloaded on each page load. Defaults to true (i.e. NOT forcibly reloaded)
   * @param  encoding (string, optional) the encoding to request for bundles. Property file resource bundles are specified to be in ISO-8859-1 format. Defaults to UTF-8 for backward compatibility.
   */
  $.i18n.properties = function(settings) {
    var defaults = {
      name:           'Messages',
      language:       'en',
      fallback:       'en',
      path:           '',
      cache:          true,
      encoding:       'UTF-8'
    };

    $.i18n.settings = $.extend(defaults, settings);

    var lang = $.i18n.settings.language;
    var shortCode = lang.length >= 2 ? lang.substring(0,2) : null;
    var longCode  = lang.length >= 5 ? lang.substring(0,5) : null;

    // 1. load requested language code (eg, Messages_pt.properties)
    if(shortCode) {
      loadAndParseLocale(shortCode, $.i18n.map);
    }

    // 2. load requested language and country code (eg, Messages_pt_PT.properties)
    if(longCode) {
      loadAndParseLocale(longCode, $.i18n.map);
    }
  };

  /**
   * Load .properties file for the provided locale into the provided map
   */
  function loadAndParseLocale(locale, map) {
    $.ajax({
      url:          getUrl(locale),
      async:        false,
      cache:        $.i18n.settings.cache,
      contentType:  'text/plain;charset=' + $.i18n.settings.encoding,
      dataType:     'text',
      success:      function(data, status) {
        $.i18n.loaded.push(locale);
        parseData(data, map);
      }
    });
  }

  function getUrl(locale) {
    return $.i18n.settings.path + $.i18n.settings.name + '_' + locale + '.properties';
  }

  /**
   * Parse .properties files
   * http://jsperf.com/i18n-parse
   */
  function parseData(data, map) {
    var line, firstEq, key, value;
    var lines = data.split("\n");

    for(var i=0; i < lines.length; i++ ) {
      line = $.trim(lines[i]);

      // comments and empty lines
      if(line.length === 0 || line.charAt(0) === '#') {
        continue;
      }

      firstEq = line.indexOf('=');

      // no equals or equals on a line by itself
      if (firstEq < 1) {
        continue;
      }

      key     = $.trim(line.substr(0, firstEq));
      value   = $.trim(line.substr(firstEq + 1));

      map[key] = value;
    }
  }

  /**
   * lookup translation by key.
   * Eg, jQuery.i18n.prop('com.company.bundles.menu_add')
   * @param {String} key the message key
   * @param {Array} [placeholderValues] placeholder value list (substitutions)
   * @param {Object} [options] hash of options
   * @param {Boolean} [options.allowNull] return an empty string if the key doesn't
   *   exist in the primary map. Do not fire any events or do a fallback lookup.
   * @return {String} the value, interpolated if necessary
   */
  $.i18n.prop = function(key, arg1, arg2) {
    var args = extractOptions(arg1, arg2);
    var placeholderValues = args.placeholderValues;
    var options = args.options;
    var activeMap = $.i18n.map;
    var value = activeMap[key];

    // null? check the fallback map
    if (value == null) {
      activeMap = $.i18n.fallbackMap;
      value = fallback(key);

      if (value == null) {
        // return null if that option is specified
        if (options.allowNull) {
          return null;
        }

        // otherwise, return the key
        $(window).trigger('i18n.missing', [key, $.i18n.settings.language]);
        return '[' + key + ']';
      }

      $(window).trigger('i18n.fallback', [key, $.i18n.settings.language]);
    }

    // tokenize the value if not already done
    // tokenize will also handle escape strings
    if (typeof(value) === 'string') {
      value = tokenize(value);
      activeMap[key] = value;
    }

    return assemble(value, placeholderValues);
  };

  /**
   * $.i18n.prop has two optional parameters: Placeholder values (an array),
   * and options (an object). This is a helper method to figure out which of
   * the two you have passed and to set those not passed to sane default values.
   * It's done with an eye towards avoiding the isArray call unless it's absolutely
   * necessary, as translations may be done 1000's of times per page.
   */
  function extractOptions(arg1, arg2) {
    var result = {};
    if (arg2) {
      result.placeholderValues = arg1 || [];
      result.options = arg2;
    } else if (arg1) {
      if ($.isArray(arg1)) {
        result.placeholderValues = arg1;
        result.options = {};
      }
      else {
        result.placeholderValues = [];
        result.options = arg1;
      }
    } else {
      result.placeholderValues = [];
      result.options = {};
    }

    return result;
  }


  /**
   * lookup a key in the fallback locale, loading that file if necessary
   */
  function fallback(key) {
    if ($.inArray($.i18n.settings.fallback, $.i18n.loaded) === -1) {
      loadAndParseLocale($.i18n.settings.fallback, $.i18n.fallbackMap);
    }

    return $.i18n.fallbackMap[key];
  }

  /**
   * Tokenize a string on {\d+}. Also process any escape sequences.
   * [].push is intentionally avoided here. Caching the
   * next index to use is much faster.
   */
  function tokenize(str) {
    var j, index, s;
    var arr = [];
    var arrCount = 0;
    var i = 0;
    while(i < str.length) {

      if (str.charAt(i) !== '{') {
        i++;
        continue;
      }

      j = str.indexOf('}');
      if (j === -1) {
        // token never ends. Let's get outta here.
        break;
      }

      index = parseInt(str.substring(i+1, j), 10);
      if (isNaN(index) || index < 0) {
        // invalid token. skip it.
        i = j + 1;
        continue;
      }

      s = str.substring(0, i);
      if (s.length > 0) {
        arr[arrCount] = escapeString(s);
        arrCount++;
      }
      arr[arrCount] = index;
      arrCount++;

      // reset counter and chop the string from current point.
      i = 0;
      str = str.substring(j+1);
    }

    // Add any remaining string to the array
    if (str.length > 0) {
      arr[arrCount] = escapeString(str);
    }

    return arr;
  }

  /**
   * return string from tokenized string array and list of placeholder values
   * http://jsperf.com/i18n-assembly
   * placholder values must already be an array, which is done for us already
   * in $.i18n.prop
   */
  function assemble(arr, placeholderValues) {
    var result = "";
    var phvLength = placeholderValues.length;
    var count = arr.length;
    for (var i=0; i < count; i++) {
      var val = arr[i];
      if (typeof(val) === 'string') {
        result = result + val;
      } else if (val < phvLength) {
        result = result + placeholderValues[val];
      } else {
        result = result + "{" + val + "}";
      }
    }
    return result;
  }

  /**
   * escape backslash characters
   * currently used only to reserve for future use
   */
  function escapeString(str) {
    var i, sub;
    while ((i = str.indexOf('\\', i)) !== -1) {
      sub = str.substring(0,i);

      if (str.charAt(i+1) === '\\') {
        // double backslash to single
        str = sub + '\\' + str.substring((i++) + 2);
      } else {
        // drop backslash
        str = sub + str.substring(i+1);
      }
    }
    return str;
  }
})(jQuery);
