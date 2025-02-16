import { LoggingMiddleware } from './logging.middleware';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import { EventEmitter } from 'events';

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;
  let req: Partial<Request>;
  let res: EventEmitter & { get: jest.Mock };
  let next: NextFunction;
  let fsAppendFileSpy: jest.SpyInstance;
  let loggerLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    middleware = new LoggingMiddleware();

    req = {
      method: 'POST',
      originalUrl: '/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
      body: { key: 'value' },
    };

    res = Object.assign(new EventEmitter(), {
      get: jest.fn().mockReturnValue('123'),
    });

    next = jest.fn();

    fsAppendFileSpy = jest
      .spyOn(fs, 'appendFile')
      .mockImplementation((filePath, data, cb) => {
        if (typeof cb === 'function') {
          cb(null);
        }
      });

    loggerLogSpy = jest
      .spyOn((middleware as any).logger, 'log')
      .mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should set req.start and call next', () => {
    middleware.use(req as Request, res as unknown as Response, next);
    expect(req['start']).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it('should log request and append file on finish (for POST with valid body)', (done) => {
    middleware.use(req as Request, res as unknown as Response, next);
    setTimeout(() => {
      (res as unknown as EventEmitter).emit('finish');
      setImmediate(() => {
        expect(fsAppendFileSpy).toHaveBeenCalled();
        expect(loggerLogSpy).toHaveBeenCalled();
        const loggedMessage = loggerLogSpy.mock.calls[0][0];
        expect(loggedMessage).toContain(req.ip);
        expect(loggedMessage).toContain(req.method);
        expect(loggedMessage).toContain(req.originalUrl);
        expect(loggedMessage).toContain(JSON.stringify(req.body));
        done();
      });
    }, 10);
  });

  it('should return empty body for GET requests', (done) => {
    req.method = 'GET';
    middleware.use(req as Request, res as unknown as Response, next);
    setTimeout(() => {
      (res as unknown as EventEmitter).emit('finish');
      setImmediate(() => {
        const loggedMessage = loggerLogSpy.mock.calls[0][0];
        expect(loggedMessage).toMatch(/- Body: ?$/);
        done();
      });
    }, 10);
  });

  it('should return empty body for non-GET requests when req.body is undefined', (done) => {
    req.method = 'POST';
    req.body = undefined;
    middleware.use(req as Request, res as unknown as Response, next);
    setTimeout(() => {
      (res as unknown as EventEmitter).emit('finish');
      setImmediate(() => {
        const loggedMessage = loggerLogSpy.mock.calls[0][0];
        expect(loggedMessage).toMatch(/- Body: ?$/);
        done();
      });
    }, 10);
  });

  it('should log truncated body if request body is too large', (done) => {
    const largeString = 'a'.repeat(1500);
    req.body = { data: largeString };
    middleware.use(req as Request, res as unknown as Response, next);
    setTimeout(() => {
      (res as unknown as EventEmitter).emit('finish');
      setImmediate(() => {
        const loggedMessage = loggerLogSpy.mock.calls[0][0];
        expect(loggedMessage).toContain(`Request body too large`);
        done();
      });
    }, 10);
  });

  it('should handle errors during request body parsing gracefully', (done) => {
    const circularObj: any = {};
    circularObj.self = circularObj;
    req.body = circularObj;
    middleware.use(req as Request, res as unknown as Response, next);
    setTimeout(() => {
      (res as unknown as EventEmitter).emit('finish');
      setImmediate(() => {
        const loggedMessage = loggerLogSpy.mock.calls[0][0];
        expect(loggedMessage).toContain('Error parsing request body');
        done();
      });
    }, 10);
  });

  it('should log error when fs.appendFile returns error', (done) => {
    fsAppendFileSpy.mockImplementation((filePath, data, cb) => {
      if (typeof cb === 'function') {
        cb(new Error('Write error'));
      }
    });
    middleware.use(req as Request, res as unknown as Response, next);
    setTimeout(() => {
      (res as unknown as EventEmitter).emit('finish');
      setImmediate(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error writing to log file:',
          expect.any(Error),
        );
        done();
      });
    }, 10);
  });
});
