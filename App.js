import createServer from './src/index.js';

class App {
  constructor(config) {
    this.config = config;
    this.appServer = createServer(config);
  }

  get server() {
    return this.appServer;
  }

  start() {
    const { PORT, HOST } = this.config;

    this.appServer.listen(Number(PORT), HOST);
  }

  stop() {
    this.appServer.close();
  }
}

export default App;
