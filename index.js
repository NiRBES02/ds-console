const Readline = require('readline');
const rl = Readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});


class Console {
  constructor() {
    this.commands = new Map();
    this.colors = {
      success: '#00ff00',
      warning: '#ffff00',
      danger: '#ff0000',
      info: '#00d0fa'
    }
  }
  
  log(...args) {
    const color = this.#getColor(args);
    const exclude = this.#getColorName(args);
    const filter = args.filter(arg => arg !== exclude);
    const time = new Date().toTimeString().split(' ')[0];
    const timestamp = `${Chalk.gray(`[${time}]`)}`;
    const arr = [];
    filter.forEach((arg) => {
      if (this.#isObject(arg)) {
        arr.push(JSON.stringify(arg));
      } else {
        arr.push(arg);
      }
    });
    const message = arr.join(' ');
    const coloredMessage = color ? color(message): message;
    const consoleWidth = process.stdout.columns || 80;
    const timestampLength = timestamp.length / 2 + 1;
    if (timestampLength + coloredMessage.length > consoleWidth) {
      const words = coloredMessage.split(' ');
      let currentLine = timestamp;
      const lines = [];
      words.forEach((word) => {
        if (currentLine.length + word.length + 1 <= consoleWidth) {
          currentLine += ` ${word}`;
        } else {
          lines.push(currentLine);
          currentLine = `${' '.repeat(timestampLength)}${word}`;
        }
      });
      lines.push(currentLine);
      console.log(lines.join('\n'));
      //console.log(filter)
    } else {
      console.log(`${timestamp} ${coloredMessage}`);
    }
  }

  #getColor(args) {
    const array = args;
    const matchedKeys = Object.keys(this.colors).filter(key => array.includes(key));
    if (matchedKeys.length > 0) {
      const colorHex = this.colors[matchedKeys[0]];
      return Chalk.hex(colorHex);
    }
    return null;
  }
  
  #getColorName(args) {
    const array = args;
    const matchedKeys = Object.keys(this.colors).filter(key => array.includes(key));
    if (matchedKeys.length > 0) {
      return matchedKeys.join()
    }
    return null;
  }

  #isObject(obj) {
    return typeof obj === 'object' && obj !== null;
  }

  #isJson(variable) {
    try {
      JSON.parse(variable);
      return true;
    } catch {
      return false;
    }
  }

  clear() {
    Readline.cursorTo(process.stdout, 0, 0);
    Readline.clearScreenDown(process.stdout);
    this.log('Консоль очищена');
  }

  cmd(name, callback) {
    this.commands.set(name, callback);
  }

  list() {
    let commands = [];
    this.commands.forEach((key, value) => {
      commands.push(value);
    });
    return commands;
  }
  
  handler() {
    rl.question('', (input) => {
      const cmd = input.split(' ')[0];
      const args = Core.parseArgsFromString(input);
      if (this.commands.has(cmd)) {
        this.commands.get(cmd)(args);
      } else {
        this.log(`Неизвестная команда: ${cmd}`, 'danger');
      }
      this.handler();
    });
  }
}

const new_console = new Console();

new_console.handler()

new_console.cmd('clear', (cmd) => new_console.clear());

module.exports = new_console;
