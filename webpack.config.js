var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var UglifyJsPlugin = require('uglifyjs-webpack-plugin');
var webpack = require('webpack');

var loaders = [
  {
    "test": /\.jsx?$/,
    "exclude": /node_modules/,
    "loader": "babel-loader",
  },
  {
    "test": /\.css?$/,
    "loader": "style-loader!css-loader?modules",
  },
];

module.exports = {
    devtool: 'eval-source-map',
    entry: path.resolve('src', 'main.js'),
    output: {
        path: path.resolve('build'),
        filename: 'main.js',
        publicPath: '/',
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    plugins: [
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            }
        }),
        new HtmlWebpackPlugin({
            template: path.resolve('src', 'dev.html'),
            filename: 'index.html',
            inject: false,
        }),
        new UglifyJsPlugin(),
    ],
    module: {
        loaders: loaders,
    },
    devServer: {
        contentBase: __dirname,
    },
};
