var path = require('path')

module.exports = {
  entry: path.resolve(__dirname, 'src/js/tracker.js'),
  output: {
    path: path.resolve(__dirname, 'public/js'),
    filename: 'script.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['react', 'es2015']
        }
      }
    ]
  }
}
