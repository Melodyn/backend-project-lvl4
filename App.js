import createServer from './src/index.js';
import loadConfig from './src/utils/configLoader.js';

class App {
  constructor(config) {
    this.config = loadConfig(config);
    this.appServer = createServer(config);
  }

  get server() {
    return this.appServer;
  }

  start() {
    const { PORT, HOST } = this.config;

    this.appServer.listen(PORT, HOST);
  }

  stop() {
    this.appServer.close();
  }
}

export default App;
