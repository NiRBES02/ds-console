const Chalk = require('chalk');
const Readline = require('readline');
const rl = Readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});
const Fs = require('fs');

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
    this.opt = {
      ident: 2.8,
      space: 10
    }
  }

  async log(...args) {
    const wrapAnsi = await import('wrap-ansi').then(m => m.default);
    const color = this.#getColor(args);
    const exclude = this.#getColorName(args);
    const filter = args.filter(arg => arg !== exclude);
    const time = new Date().toTimeString().split(' ')[0];
    const timestamp = `${Chalk.underline.gray(`[${time}]`)}`;
    const arr = [];
    filter.forEach((arg) => {
      arr.push(this.dataTypeConvert(arg));
    });
    const message = arr.join(' ');
    const coloredMessage = color ? color(message) : message;
    const consoleWidth = process.stdout.columns || 80;
    const wrappedMessage = wrapAnsi(coloredMessage, 
      consoleWidth - (timestamp.length / this.opt.ident), { hard: true })
      .split('\n')
      .map((line, index) => index === 0 ? `${timestamp} ${line}` : `${' '.repeat(this.opt.space)} ${line}`)
      .join('\n');
    console.log(wrappedMessage);
  }

  dataTypeConvert(value) {
    const anonymouse = 'anonymouse';
    const type = typeof value;
    if (value === null) {
      return Chalk.magenta('null');
    }
    if (value === undefined) {
      return Chalk.gray('undefined');
    }
    if (type === 'object') {
      if (Array.isArray(value)) {
        return Chalk.yellow(JSON.stringify(value));
      }
      if (value instanceof Date) {
        return Chalk.magenta(value.toString());
      }
      if (value instanceof RegExp) {
        return Chalk.magenta(value.toString());
      }
      if (value.constructor && value.constructor !== Object) {
        const className = value.constructor.name || anonymouse;
        return Chalk.cyan(`[class ${className}]`);
      }
      return Chalk.yellow(JSON.stringify(value));
    }
    if (type === 'function') {
      const functionName = value.name || anonymouse;
      return Chalk.cyan(`[function ${functionName}]`)
    }
    if (type === 'number' || type === 'bigint') {
      return Chalk.yellow(value.toString())
    }
    if (type === 'boolean') {
      return Chalk.magenta(value.toString())
    }
    if (type === 'symbol') {
      return Chalk.cyan(value.toString())
    }
    return value.toString();
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
      return matchedKeys.join();
    }
    return null;
  }

  
  #isObject(obj) {
    return typeof obj === 'object' && obj !== null;
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

  cmd(...args) {
    let name;
    let description;
    let value;
    let unknown = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (typeof arg === 'string') {
        if (arg.split(' ').length === 1) {
        } else {
          description = arg;
        }
      } else if (typeof arg === 'object') {
        if (arg.description) {
          description = arg.description;
        }
      } else if (typeof arg === 'function') {
        value = arg;
      } else {
        unknown.push(arg);
      }
      if (name && value) {
        this.commands.set(name, {
          name,
          description,
          value,
          unknown
        });
        name = undefined;
        description = undefined;
        value = undefined;
        unknown = [];
      }
    }
  }

  placeholder(str, obj) {
    const replace = str.replace(/{(.*?)}/g, (match, key) => {
      const keys = key.split('.');
      let value = obj;
      for (const k of keys) {
        value = value[k];
        if (value === undefined) {
          return match;
        }
      }
      return value || match;
    });
    return replace.toString();
  }

  help() {
    const obj = Object.fromEntries(this.commands);
    const dir = __dirname;
    const file = Fs.readFileSync(`${dir}/help.txt`,
      'utf8');
    Object.entries(obj).forEach(([key, value]) => {
      const description = (value.description === undefined) ? Chalk.red('Отсутствует') : value.description;
      const unknown = () => {
        if (Array.isArray(value.unknown) && value.unknown.length > 0) {
          return `debug: ${Chalk.red(value.unknown.join(', '))}`;
        } else {
          return `debug: ${Chalk.green('ok')}`;
        }
      };
      this.log(this.placeholder(file, {
        info: {
          name: Chalk.green('Название:'),
          description: Chalk.green('Описание:'),
          unknown: unknown()
        },
        cmd: {
          name: value.name,
          description: description
        }
      }));
    });
  }

  handler() {
    rl.question('',
      (input) => {
        const cmd = input.split(' ')[0];
        const args = this.parseArgsFromString(input);
        if (this.commands.has(cmd)) {
          this.commands.get(cmd).value(args);
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

new_console.cmd('clear', {
  description: 'Очистить консоль'
}, () => new_console.clear());
new_console.cmd('stop', {
  description: 'Остановить приложение'
}, (cmd) => {
  new_console.log('Закрытие приложения...');
  setInterval(() => process.exit(0), 100);
});
new_console.cmd('help', {
  description: 'Получить помощь по командам'
}, () => {
  new_console.log('Помощь по командам:', 'magenta');
  new_console.help();
});

module.exports = new_console;
module.exports.chalk = Chalk;