module.exports = {
    entry: {
      quiz: "./src/quiz.tsx",
      "quiz-master": "./src/quiz-master.tsx"
    },
  
    output: {
        path: "../public/",
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

