#gulp-minify-template-inline
---
It is a gulp plugin to uglify & inline underscore template into a js file.

#example
---
```
    var inlineTemplate=require("gulp-minify-template-inline");
    gulp.task('minifyTemplateInline', function () {
    gulp.src('./trunk/**/*.js')
        .pipe(inlineTemplate())
        .pipe(gulp.dest('./build/template'));
    });
```
When you want to use uglify,you can useed bt this way:
```
    gulp.task('minifyTemplateInline', function () {
    gulp.src('./trunk/**/*.js')
        .pipe(inlineTemplate({minify:true})) //this place you can set the uglify options too;
        .pipe(gulp.dest('./build/template'));
    });
```
