var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var webpack = require('webpack');

var loaders = [
  {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    use: {
        loader: "babel-loader",
    },
  },
  {
    test: /\.css?$/,
    use: ["style-loader", "css-loader"],
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
        new HtmlWebpackPlugin({
            template: path.resolve('src', 'dev.html'),
            filename: 'index.html',
            inject: false,
        }),
    ],
    module: {
        rules: loaders,
    },
    devServer: {
        port: 5050,
        contentBase: __dirname,
        publicPath: "/build",
        historyApiFallback: {
            index: 'index.html',
        },
    },
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
};
