import createServer from './src/index.js';

class App {
  constructor(config) {
    console.log({ config });
    this.config = config;
    this.appServer = createServer();
  }

  get server() {
    return this.appServer;
  }

  start() {
    const { PORT, HOST } = this.config;

    this.appServer.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  }

  stop() {
    this.appServer.close();
  }
}

export default App;
