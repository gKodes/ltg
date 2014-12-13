'use strict';
var gutil = require('gulp-util'),
    path = require('path'),
    fs = require('fs'),
    through = require('through2'),
    Buffer = require('buffer').Buffer,
    IMPORT_REGX = /\/\*#inport[\s]*(['<])[\s]*(.+)[\s]*['>][\s]*\*\/[\r\n]*/g;

var PluginError = function(message) {
  return new gutil.PluginError('gulp-js-include', message);
};

module.exports = function(paths) {
  var files = [];

  return through.obj(function(file, enc, callback) {
    if (file.isStream()) {
      this.emit('error', PluginError('Streaming not supported'));
      return callback();
    }

    try {
      var incSrc = {}, includes = [file.path], incContent, cws, streanThis = this;
      incSrc[file.path] = file.contents.toString();
      gutil.log(file.path);

      while( (incContent = incSrc[cws = includes.pop()]) ) {
        incSrc[cws] = incContent.replace(IMPORT_REGX,function(line, type, src) {
          var isAbsPath = (type != '<'), idx = paths.length, incPath;
          if( isAbsPath ) {
            incPath = path.join( path.dirname(cws), src );
          } else {
            while ( idx-- && !( fs.existsSync( 
              incPath = path.join(paths[idx], src) ) ) );
          }

          if( !fs.existsSync( incPath = path.resolve(incPath) ) ) {
            streanThis.emit('error', PluginError('include "' + incPath + '" not found'));
            return callback();
          }

          //console.info(incPath);
          
          if( !(incPath in incSrc) ) {
            //console.info(incPath);
            incSrc[incPath] = fs.readFileSync(incPath).toString();
            includes.push(incPath);
            return '/*#inport \'' + incPath + '\'*/' + gutil.linefeed;
          }

          return gutil.linefeed;
        });
      } // end while

      var includePath, streanThis = this, includes = [],
          processed = incSrc[file.path];

      while(IMPORT_REGX.test(processed)) {
        processed = processed.replace(IMPORT_REGX,function(line, type, src) {
          if( !~includes.indexOf(src) ) {
            includes.push(src);
            return incSrc[src] + gutil.linefeed;
          }
          return '';
        });
      }

      file.contents = new Buffer(processed);
      this.push(file)
    } catch(err) {
      this.emit('error', PluginError(err));
      return callback();
    }

    callback();
  });
};