const { map } = require('lodash')
const path = require('path')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')
const dev = process.env.NODE_ENV === "development"

let config = {
    mode: "development",
    entry: './index.js',
    watch: dev,
    output: {
        path: path.resolve(__dirname, './public/assets'),
        filename: 'main.js',
        publicPath: '/assets/'
    },
    devtool: dev ? "cheap-module-eval-source-map" : "source-map",
    devServer: {
        contentBase: path.resolve(__dirname, './public'),
        host: '0.0.0.0',
        port: 8080
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                  loader: 'babel-loader'
                }
            },
        ]
    },
    plugins: [
        new Dotenv(),
    ]
}

if(!dev){
    config.plugins.push(new UglifyJSPlugin(
        {
            sourceMap: true
        }
    ))
    config.mode = "production"
}

module.exports = config
