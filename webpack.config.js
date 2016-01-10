var path = require('path');
var webpack = require('webpack');

var plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }
  })
];
if (process.env.NODE_ENV == 'production') {
  plugins.push(new webpack.optimize.DedupePlugin());
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    compressor: {
      warnings: false
    }
  }));
}

module.exports = {
  cache: true,
  context: path.join(__dirname, "src"),
  entry: './main.js',
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, 'build'),
    publicPath: '/build/',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: /\.less$/, loader: "style!css!less"},
      { test: /\.css/, loader: "style-loader!css-loader" },
      { test:/.png$|.jpg$|.jpeg$|.gif$|.svg$/, loader: "url-loader?limit=10000"},
      { test:/.woff$|.woff2$/, loader: "url-loader?limit=10000"},
      { test:/.ttf$|.eot$/, loader: "file-loader"},
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ],
    noParse: /parse-latest.js/
  },
  plugins: plugins,
  eslint: {
    configFile: path.join(__dirname, '.eslintrc')
  }
};
