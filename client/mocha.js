// https://github.com/Khan/react-components/blob/master/test/compiler.js
var babel = require('babel');
var fs = require('fs');
var ReactTools = require('react-tools');


var origJs = require.extensions['.js'];


function shouldStub(filename) {
  // Should this file be stubbed out for testing?
  if (!global.reactModulesToStub) return false;

  // Check if the file name ends with any stub path.
  var stubs = global.reactModulesToStub;
  for (var i = 0; i < stubs.length; i++) {
    if (filename.substr(-stubs[i].length) == stubs[i]) {
      return true;
    }
  }
  return false;
}


function transform(filename) {
  // Transform a file via JSX/Harmony or stubbing.
  if (shouldStub(filename)) {
    // A module that exports a single, stubbed-out React Component.
    delete require.cache[filename];
    return 'module.exports = require("react").createClass(' +
           '{render:function(){return null;}});';
  } else {
    var content = fs.readFileSync(filename, 'utf8');
    return ReactTools.transform(
      babel.transform(content, {
        optional: ['runtime'],
        stage: 0
      }).code
    );
  }
}


require.extensions['.js'] = function(module, filename) {
  // Install the compiler.
  if (filename.indexOf('client/node_modules/') >= 0) {
    // Skip Node modules.
    return (origJs || require.extensions['.js'])(module, filename);
  }

  return module._compile(transform(filename), filename);
};
