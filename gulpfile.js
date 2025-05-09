const { src, dest } = require('gulp');

/**
 * Copies Node icons to the dist folder
 */
function copyIcons() {
  return src('nodes/**/*.svg')
    .pipe(dest('dist/nodes'));
}

exports['build:icons'] = copyIcons;
