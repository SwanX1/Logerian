import { Logger, coloredLog, getLoggerLevelName, LoggerLevel } from '../src/index';
import { WriteStream } from 'fs';


const levels: readonly (keyof typeof LoggerLevel)[] = Object.freeze(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']);

test('logger level is in correct order', () => {
  expect(LoggerLevel.DEBUG).toBeLessThan(LoggerLevel.INFO);
  expect(LoggerLevel.INFO).toBeLessThan(LoggerLevel.WARN);
  expect(LoggerLevel.WARN).toBeLessThan(LoggerLevel.ERROR);
  expect(LoggerLevel.ERROR).toBeLessThan(LoggerLevel.FATAL);
});

test('coloredLog outputs correct string', () => {
  const regex = (color: string, level: string) => new RegExp(`^\x1B\\[90m\\[\\d{2}:\\d{2}:\\d{2}\\]\x1B\\[39m \x1B\\${color}${('\\[' + level + '\\]').padEnd(9, ' ')}\x1B\\[39m $`);

  expect(coloredLog(LoggerLevel.DEBUG)).toMatch(regex('[34m', 'DEBUG'));
  expect(coloredLog(LoggerLevel.INFO)).toMatch(regex('[32m', 'INFO'));
  expect(coloredLog(LoggerLevel.WARN)).toMatch(regex('[33m', 'WARN'));
  expect(coloredLog(LoggerLevel.ERROR)).toMatch(regex('[31m', 'ERROR'));
  expect(coloredLog(LoggerLevel.FATAL)).toMatch(regex('[31m', 'FATAL'));
});

test('getLoggerLevelName returns correct string', () => {
  for (const level of levels) {
    expect(getLoggerLevelName(LoggerLevel[level])).toBe(level);
  }
});

test('respects loggerlevels', () => {

  for (const level of levels) {
    let wrote = false;
    const write = () => wrote = true;
    const logger = new Logger({
      streams: [
        {
          level: LoggerLevel[level],
          stream: { write }
        }
      ]
    });

    for (const comparelevel of levels) {
      //@ts-ignore hacky stuff
      (logger[comparelevel.toLowerCase()] as ((...data: any[]) => void))();
      expect(wrote).toBe(LoggerLevel[level] <= LoggerLevel[comparelevel]);
      wrote = false;
    }
  }
});

test('strips formatting for fs.WriteStream', () => {
  class MockWriteStream extends WriteStream {
    constructor(writeFunc: (...data: any[]) => any) {
      //@ts-ignore typescript is dumb and doesn't know better
      super('');
      this.write = writeFunc;
    }

    open() {}
  }

  let writtenString = '';
  const logger = new Logger({
    streams: [
      {
        stream: new MockWriteStream((s: string) => writtenString = s)
      }
    ]
  });

  logger.info('test');
  expect(writtenString).toBe('test\n');
  logger.info(`\x1b[33mHello\x1b[39m World!`);
  expect(writtenString).toBe('Hello World!\n');
});