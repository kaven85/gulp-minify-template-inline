var through = require('through2'),
	_ = require('underscore'),
	uglify = require('uglify-js'),
	gutil = require('gulp-util'),
	fs = require('fs'),
	merge = require('deepmerge'),
	PluginError = require('gulp-util/lib/PluginError'),
	applySourceMap = require('vinyl-sourcemaps-apply'),
	reSourceMapComment = /\n\/\/# sourceMappingURL=.+?$/,
	pluginName="gulp-minify-template-inline";
function minify(file, options, cb) {
	var mangled;

	try {
		mangled = uglify.minify(String(file.contents), options);
		mangled.code = new Buffer(mangled.code.replace(reSourceMapComment, ''));
		cb(null, mangled);
	} catch (e) {
		cb(new PluginError(pluginName, e.message || e.msg, {
			fileName: file.path,
			lineNumber: e.line,
			stack: e.stack,
			showStack: false
		}));
	}
}

function setup(opts) {
	var options = merge(opts || {}, {
		fromString: true,
		output: {}
	});

	if (options.preserveComments === 'all') {
		options.output.comments = true;
	} else if (options.preserveComments === 'some') {
		// preserve comments with directives or that start with a bang (!)
		options.output.comments = /^!|@preserve|@license|@cc_on/i;
	} else if (typeof options.preserveComments === 'function') {
		options.output.comments = options.preserveComments;
	}

	return options;
}
module.exports = function (opt) {
	opt = opt || {};
	function uglify(file, encoding, callback) {
		/*jshint validthis:true */

		var options = setup(opt);

		if (file.isNull()) {
			return callback(null, file);
		}

		if (file.isStream()) {
			return callback(new PluginError(pluginName, 'Streaming not supported', {
				fileName: file.path,
				showStack: false
			}));
		}

		if (file.sourceMap) {
			options.outSourceMap = file.relative;
			options.inSourceMap = file.sourceMap.mappings !== '' ? file.sourceMap : undefined;
		}
		minify(file, options, function (err, mangled) {
			if (err) {
				return callback(err);
			}

			file.contents = mangled.code;

			if (file.sourceMap) {
				applySourceMap(file, mangled.map);
			}

			callback(file);
		});
	}

	function compile(file, encoding, callback) {
		var parts = file['history'][0].split('\\');
		parts.pop();
		if (file.isNull()) {
			return callback(null, file);
		}

		if (file.isStream()) {
			return callback(new gutil.PluginError('gulp-minify-inline', 'doesn\'t support Streams'));
		}
		var jsText = (file.contents.toString())

		var has_done_nothing = true;
		jsText = jsText.replace(/__inline\([\'\"]([^\(\)]*)[\'\"]\)/g, function (match, jsUrl) {
			var tempUrl = parts.join('/') + '/' + jsUrl;
			if (fs.existsSync(tempUrl)) {
				var data = fs.readFileSync(tempUrl).toString();
				if (data.indexOf('<%') != -1) {
					var temp = _.template(data).source;
				}
				if (temp) {
					return temp;
				}else{
					return "\'"+data+"\'";
				}
			} else {
				return callback(new gutil.PluginError('gulp-minify-inline', 'the template is not exist:'+tempUrl));
			}
		})
		if (jsText) {
			file.contents = new Buffer(jsText);
			if (opt.minify) {
				uglify(file, opt,function(data){
					callback(null, data);
				});
			} else {
				callback(null, file);
			}
		}
	}
	return through.obj(compile);

};