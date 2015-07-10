// https://github.com/Khan/react-components/blob/master/test/compiler.js
var babel = require('babel');
var fs = require('fs');


var origJs = require.extensions['.js'];


function transform(filename) {
  // Transform a file via JSX/Harmony or stubbing.
  var content = fs.readFileSync(filename, 'utf8');
  return babel.transform(content, {
      optional: ['runtime']
  }).code
}


require.extensions['.js'] = function(module, filename) {
  // Install the compiler.
  if (filename.indexOf('node_modules/') >= 0) {
    // Skip Node modules.
    return (origJs || require.extensions['.js'])(module, filename);
  }

  return module._compile(transform(filename), filename);
};
