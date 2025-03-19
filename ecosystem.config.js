module.exports = {
    apps: [
      {
        name: "react-dev",
        script: "npm",
        args: "start",
        watch: true, // Reinicia automaticamente em caso de mudanças
        env: {
          NODE_ENV: "development",
        },
      },
    ],
  };
  