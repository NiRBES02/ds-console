## Информация
Маленькая и простая библиотека для форматированного логирования и ввода команд в консоль для вашего NodeJs прмложения.

[![npm version](https://badge.fury.io/js/ds-console.svg)](https://www.npmjs.com/package/ds-console)
[![GitHub issues](https://img.shields.io/github/issues/NiRBES02/ds-console.svg)](https://github.com/NiRBES02/ds-console/issues)
[![GitHub stars](https://img.shields.io/github/stars/NiRBES02/ds-console.svg)](https://github.com/NiRBES02/ds-console/stargazers)
[![Discord](https://img.shields.io/discord/1268172383286722591.svg?label=Join%20Discord&logo=discord)](https://discord.gg/3QKtvHkSMK)

Возможности доступные Вам:
- Создание собственных команд для Вашего приложения.
- Логирование с использованием цветового обозначения (успешно, внимание, ошибка, информация).

Удобство:
- Вваод консоли имеет временную отметку которая не бросается в глаза.
- Имеет адаптивность, если вывод в консоль слишком длинный, то он автоматически перенесется на новую строчку не смешиваясь с другой информацией.

## Установка
Установите библиотеку в свой проект в качестве зависимости:
```bash
mkdir project_name
cd project_name
npm i --save ds-console
```
Вы установили библиотеку в свой проект

## Использование
### Логирование
Подключите библиотеку к своему проекту и напишите свой первый `hello world!`:
```js
const Console = require('ds-console');

Console.log('Этот текст написан для проверки обработки текста. Данный метод принимает не только строку, а также булевые значения: ', true, false, 'цифры: ', 1, 2, 3, 'и объекты:', {
  test: 'test',
  ban: 'ban',
}, 'info');
```
### Обычная команда
```js
const Console = require('ds-console');

Console.cmd('ping', () => {
  Console.log('pong');
});
```
```
> ping
console => [00:44:32] pong
```

### Команда с использованием арг-флагом
```js
const Console = require('ds-console');

Console.cmd('ping', (arg) => {
  if (arg.flags.view){
    Console.log('pong');
  }
});
```
```
> ping --view
console => [00:44:32] pong
> ping
console => 
```

### Команда с использованием арг-значением
```js
const Console = require('ds-console');

Console.cmd('ping', (arg) => {
  if (arg.values.view == 'yes'){
    Console.log('pong');
  }
});
```
```
> ping --view=yes
console => [00:44:32] pong
> ping
console => 
```