import { AppModule } from '../src/app.module';
import { LoggingMiddleware } from '../src/middleware/logging.middleware';

describe('AppModule Middleware Configuration', () => {
  let appModule: AppModule;
  let fakeConsumer: any;
  let forRoutesSpy: jest.Mock;

  beforeEach(() => {
    appModule = new AppModule();
    forRoutesSpy = jest.fn();
    fakeConsumer = {
      apply: jest.fn(() => ({
        forRoutes: forRoutesSpy,
      })),
    };
  });

  it('should apply LoggingMiddleware for all routes', () => {
    appModule.configure(fakeConsumer);
    expect(fakeConsumer.apply).toHaveBeenCalledWith(LoggingMiddleware);
    expect(forRoutesSpy).toHaveBeenCalledWith('*');
  });
});
