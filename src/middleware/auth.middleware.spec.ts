import { AuthMiddleware } from './auth.middleware';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(), // Mock ConfigService.get method
    } as any; // Type assertion to ConfigService

    authMiddleware = new AuthMiddleware(mockConfigService);
  });

  it('should be defined', () => {
    expect(authMiddleware).toBeDefined();
  });

  it('should call next() if API key is valid', () => {
    const mockApiKey = 'test-api-key';
    (mockConfigService.get as jest.Mock).mockReturnValue(mockApiKey); // Mock ConfigService.get to return test API key

    const mockRequest: any = {
      headers: { 'x-api-key': mockApiKey },
    };
    const mockResponse: any = {};
    const mockNext = jest.fn(); // Mock NextFunction

    authMiddleware.use(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled(); // Assert that next() was called
  });

  it('should throw UnauthorizedException if API key is missing', () => {
    (mockConfigService.get as jest.Mock).mockReturnValue('test-api-key'); // Mock ConfigService.get (API key exists in config)

    const mockRequest: any = {
      headers: {}, // Missing x-api-key header
    };
    const mockResponse: any = {};
    const mockNext = jest.fn();

    expect(() => {
      authMiddleware.use(mockRequest, mockResponse, mockNext);
    }).toThrowError(UnauthorizedException); // Assert that it throws UnauthorizedException

    try {
      authMiddleware.use(mockRequest, mockResponse, mockNext);
    } catch (error) {
      expect(error.message).toEqual('Invalid API Key'); // Assert correct error message
    }

    expect(mockNext).not.toHaveBeenCalled(); // Assert that next() was NOT called
  });

  it('should throw UnauthorizedException if API key is invalid', () => {
    const mockApiKey = 'test-api-key';
    (mockConfigService.get as jest.Mock).mockReturnValue(mockApiKey); // Mock ConfigService.get (expected API key)

    const mockRequest: any = {
      headers: { 'x-api-key': 'wrong-api-key' }, // Incorrect API key provided
    };
    const mockResponse: any = {};
    const mockNext = jest.fn();

    expect(() => {
      authMiddleware.use(mockRequest, mockResponse, mockNext);
    }).toThrowError(UnauthorizedException); // Assert throws UnauthorizedException

    try {
      authMiddleware.use(mockRequest, mockResponse, mockNext);
    } catch (error) {
      expect(error.message).toEqual('Invalid API Key'); // Assert correct error message
    }
    expect(mockNext).not.toHaveBeenCalled(); // Assert next() was NOT called
  });
});
