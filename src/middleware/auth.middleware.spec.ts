import { AuthMiddleware } from './auth.middleware';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    } as any;

    authMiddleware = new AuthMiddleware(mockConfigService);
  });

  it('should be defined', () => {
    expect(authMiddleware).toBeDefined();
  });

  it('should call next() if API key is valid', () => {
    const mockApiKey = 'test-api-key';
    (mockConfigService.get as jest.Mock).mockReturnValue(mockApiKey);

    const mockRequest: any = {
      headers: { 'x-api-key': mockApiKey },
    };
    const mockResponse: any = {};
    const mockNext = jest.fn();

    authMiddleware.use(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if API key is missing', () => {
    (mockConfigService.get as jest.Mock).mockReturnValue('test-api-key');

    const mockRequest: any = {
      headers: {},
    };
    const mockResponse: any = {};
    const mockNext = jest.fn();

    expect(() => {
      authMiddleware.use(mockRequest, mockResponse, mockNext);
    }).toThrowError(UnauthorizedException);

    try {
      authMiddleware.use(mockRequest, mockResponse, mockNext);
    } catch (error) {
      expect(error.message).toEqual('Invalid API Key');
    }

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if API key is invalid', () => {
    const mockApiKey = 'test-api-key';
    (mockConfigService.get as jest.Mock).mockReturnValue(mockApiKey);

    const mockRequest: any = {
      headers: { 'x-api-key': 'wrong-api-key' },
    };
    const mockResponse: any = {};
    const mockNext = jest.fn();

    expect(() => {
      authMiddleware.use(mockRequest, mockResponse, mockNext);
    }).toThrowError(UnauthorizedException);

    try {
      authMiddleware.use(mockRequest, mockResponse, mockNext);
    } catch (error) {
      expect(error.message).toEqual('Invalid API Key');
    }
    expect(mockNext).not.toHaveBeenCalled();
  });
});
