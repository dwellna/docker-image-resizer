#!/usr/bin/env node

'use strict';

var program, path, fs, mkdirp, pkg, chalk, _;


program = require('commander');
fs      = require('fs');
mkdirp  = require('mkdirp');
path    = require('path');
chalk   = require('chalk');
pkg     = require('../package.json');
_       = require('lodash');

/**
File/Directory helper functions
*/
function write(path, str, mode) {
  fs.writeFileSync(path, str, { mode: mode || '0666' });
  console.log('    ' + chalk.green('create') + ': ' + path);
}

function copy(from, to) {
  write(to, fs.readFileSync(from, 'utf-8'));
}

function mkdir(path, fn) {
  mkdirp.sync(path, '0755');
  console.log('    ' + chalk.green('create') + ': ' + path);
}

function emptyDirectory(path, fn) {
  fs.readdir(path, function(err, files){
    if (err && 'ENOENT' !== err.code) {
      throw err;
    }
    fn(!files || !files.length);
  });
}

function createApplicationAt(dir){
  var appName, newPkg;

  // Determine the app name from the directory
  appName = path.basename(path.resolve(dir));

  console.log('\n' + chalk.cyan('Creating new ') + chalk.cyan.bold('image-resizer') + chalk.cyan(' app!'));
  console.log();

  // create a new package.json
  newPkg = {
    name: appName,
    version: '0.1.0',
    description: 'An image-resizer instance',
    main: 'server.js',
    scripts: {
      'start': 'node server.js'
    },
    dependencies: {
      'chalk': pkg.dependencies.chalk,
      'express': pkg.dependencies.express,
      'image-resizer': 'dwellna/docker-image-resizer#v' + pkg.version,
      'lodash': pkg.dependencies.lodash,
      'sharp': '0.31.2'
    },
    devDependencies: pkg.devDependencies,
    engines: {
      'node': pkg.engines.node
    }
  };

  write(dir + '/package.json', JSON.stringify(newPkg, null, 2));

  // create server.js
  var serverTmpl = fs.readFileSync(__dirname + '/./templates/server.js.tmpl');
  write(dir + '/server.js', _.template(serverTmpl, {}));

  // create the gulpfile
  copy(__dirname + '/./templates/gulpfile.js.tmpl', dir + '/gulpfile.js');

  // create .env
  var envTmpl = fs.readFileSync(__dirname + '/./templates/.env.tmpl');
  write(dir + '/.env', _.template(envTmpl, {cwd: process.cwd()}));

  // create .gitignore
  copy(__dirname + '/./templates/.gitignore.tmpl', dir + '/.gitignore');

  // create .jshintrc
  copy(__dirname + '/../.jshintrc', dir + '/.jshintrc');

  // create Heroku files
  copy(__dirname + '/./templates/.buildpacks.tmpl', dir + '/.buildpacks');
  copy(__dirname + '/./templates/Procfile.tmpl', dir + '/Procfile');

  // create a README
  copy(__dirname + '/./templates/README.md.tmpl', dir + '/README.md');

  // create plugin folders
  //  - sources
  //  - filters
  mkdir(dir + '/plugins/sources');
  mkdir(dir + '/plugins/filters');


  console.log();
  console.log(chalk.green('   now install your dependencies') + ':');
  console.log('     $ npm install');
  console.log();
  console.log(chalk.green('   then to run the app locally') + ':');
  console.log('     $ gulp watch');
  console.log();

  console.log(chalk.yellow('   to get up and running on Heroku') + ':');
  console.log('     https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction');
  console.log();
}

/**
Create the program and list the possible commands
*/
program.version(pkg.version);
program.option('-f, --force', 'force app build in an non-empty directory');
program.command('new')
  .description('Create new clean image-resizer app')
  .action( function () {
    var path = '.';
    emptyDirectory(path, function(empty) {
      if (empty || program.force){
        createApplicationAt(path);
      }
      else {
        console.log(
          chalk.red('\n    The current directory is not empty, please use the force (-f) option to proceed.\n')
        );
      }
    });
  });
program.command('filter <name>')
  .description('Create new filter stream')
  .action( function (filterName) {
    copy(__dirname + '/./templates/filter.js.tmpl', './plugins/filters/' + filterName + '.js');
  });
program.parse(process.argv);
