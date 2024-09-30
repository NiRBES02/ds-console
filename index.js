const Chalk = require('chalk');
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
      info: '#00ffff',
      primary: '#0077ff',
      secondary: '#666666',
      magenta: '#ff66ee' 
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
  
  parseArgsFromString(input) {
    const parsed = {
      flags: {},
      values: {},
      unknown: []
    };
    const args = input.split(' ') || input;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        const [key,
          value] = arg.slice(2).split('=');
        if (value !== undefined) {
          parsed.values[key] = value;
        } else {
          parsed.flags[key] = true;
        }
      } else if (arg.startsWith('-')) {
        const key = arg.slice(1);
        parsed.flags[key] = true;
      } else {
        parsed.unknown.push(arg);
      }
    }
    return parsed;
  }

  clear(bool = true) {
    Readline.cursorTo(process.stdout, 0, 0);
    Readline.clearScreenDown(process.stdout);
    if (bool) {
    this.log('Консоль очищена');
    }
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
      const args = this.parseArgsFromString(input);
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

new_console.handler();
new_console.clear(false);

new_console.cmd('clear', () => new_console.clear());
new_console.cmd('stop', (cmd) => {
  new_console.log('Закрытие приложения...');
  setInterval(() => process.exit(0), 100);
});

module.exports = new_console;
module.exports.chalk = Chalk;
