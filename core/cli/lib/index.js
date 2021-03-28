'use strict';

const pkg = require('../package.json')

module.exports = cli;

function cli () {
    // TODO
    console.log('cli 1111');
    checkPkgVersion()
}

function checkPkgVersion () {
    console.log(pkg.version);
}
