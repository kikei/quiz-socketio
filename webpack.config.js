module.exports = {
    entry: {
      quiz: "./client/quiz.tsx"
    },
  
    output: {
        path: "./public",
        filename: "[name].js",
    },

    devtool: "source-map",

    resolve: {
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },

    module: {
        loaders: [
          { test: /\.tsx?$/, loader: "ts-loader" }
        ],
    },

    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
    },
};

