module.exports = function(grunt) {
  var webpack = require("webpack"),
      sh = require("execSync");
  require("es6ify").traceurOverrides = {blockBinding: true};
  grunt.loadNpmTasks("grunt-webpack");
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.initConfig({
    mochaTest: {
      test: {
        src: ["src/test.js"],
        options: {
        }
      }
    },
    webpack: {
      options: {
        watch: true,
        output: {
          libraryTarget: "umd",
          path: __dirname + "/dist/",
          filename: "[name].js"
        },
        resolve: {
          alias: {
            "can/eventstream": "./can.js"
          }
        },
        externals: {
          can: "umd can",
          jquery: {
            "root": "jQuery",
            "commonjs": "jquery",
            "commonjs2": "jquery",
            "amd": "jquery"
          },
          bacon: {
            "root": "Bacon",
            "commonjs": "bacon",
            "commonjs2": "bacon",
            "amd": "bacon"
          }
        },
        devtool: "#sourcemap",
        module: {
          loaders: [{
            test: /\.js$/,
            loader: "transform/cacheable?es6ify"
          }]
        }
      },
      lib: {entry: {"can.bacon": "./src/index.js"}},
      libMin: {
        entry: {"can.bacon.min": "./src/index.js"},
        plugins: [new webpack.optimize.UglifyJsPlugin({compressor:{warnings:false}})]
      }
    }
  });

  grunt.registerTask("default", ["test", "build"]);
  grunt.registerTask("test", ["mochaTest:test"]);
  grunt.registerTask("build", ["webpack:lib", "webpack:libMin"]);
  grunt.registerTask("dev", ["webpack:lib:keepalive"]);
  grunt.registerTask("update-build", "Commits the built version", function() {
    exec([
      "git add ./dist",
      "git commit --allow-empty -m 'Updating build files'"
    ]);
  });
  grunt.registerTask("tag", "Tag a new release on master", function(type) {
    type = type || "patch";
    exec([
      "git remote update",
      "git checkout master",
      "git pull --ff-only",
      "npm version "+type+" -m 'Upgrading to %s'",
      "git checkout develop",
      "git pull --ff-only",
      "git merge master"
    ]);
  });
  grunt.registerTask("release", "Make a release", function(type) {
    grunt.task.run("build", "update-build", "tag"+(type?":"+type:""));
  });
  grunt.registerTask("publish", "Publish to npm and bower", function() {
    exec([
      "git push origin develop:develop",
      "git push origin master:master",
      "git push --tags",
      "npm publish ."
    ]);
  });

  function exec(commands) {
    commands.forEach(function(cmd) {
      var result = sh.exec(cmd);
      grunt.log.write(result.stdout || "");
      grunt.log.write(result.stderr || "");
      if (result.code) {
        throw new Error("exit "+result.code);
      }
    });
  }
};
