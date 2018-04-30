require('fast-glob');
require('jsdom');
require('babylon');

require('./dist').run(process.argv.slice(2));
