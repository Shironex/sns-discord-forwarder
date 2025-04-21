import { formatUptime, readHtmlFile } from '../../src/utils';
import fs from 'fs';

// Mock the fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}));

// Mock the logger to prevent console output during tests
jest.mock('../../src/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('formatUptime', () => {
  test('should format seconds to days, hours, minutes correctly', () => {
    // Test various time intervals
    expect(formatUptime(30)).toBe('0 min');
    expect(formatUptime(60)).toBe('1 min');
    expect(formatUptime(90)).toBe('1 min');
    expect(formatUptime(3600)).toBe('1 hour, 0 min');
    expect(formatUptime(3660)).toBe('1 hour, 1 min');
    expect(formatUptime(3720)).toBe('1 hour, 2 min');
    expect(formatUptime(7200)).toBe('2 hours, 0 min');
    expect(formatUptime(86400)).toBe('1 day, 0 min');
    expect(formatUptime(90000)).toBe('1 day, 1 hour, 0 min');
    expect(formatUptime(172800)).toBe('2 days, 0 min');
    expect(formatUptime(172900)).toBe('2 days, 1 min');
    expect(formatUptime(176400)).toBe('2 days, 1 hour, 0 min');
    expect(formatUptime(176460)).toBe('2 days, 1 hour, 1 min');
  });

  test('should handle zero seconds', () => {
    expect(formatUptime(0)).toBe('0 min');
  });

  test('should use correct pluralization', () => {
    expect(formatUptime(60)).toBe('1 min');
    expect(formatUptime(120)).toBe('2 min');
    expect(formatUptime(3600)).toBe('1 hour, 0 min');
    expect(formatUptime(7200)).toBe('2 hours, 0 min');
    expect(formatUptime(86400)).toBe('1 day, 0 min');
    expect(formatUptime(172800)).toBe('2 days, 0 min');
  });
});

describe('readHtmlFile', () => {
  // Save original environment
  const originalEnv = process.env.NODE_ENV;
  
  // Reset mocks and environment before each test
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.NODE_ENV = originalEnv;
  });
  
  // Restore original environment after all tests
  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('should read file from primary path in development environment', () => {
    // Set environment to development
    process.env.NODE_ENV = 'development';
    
    // Mock existsSync to return true for src path
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      return path.includes('src/public/test.html');
    });
    
    // Mock readFileSync to return expected content
    (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('src/public/test.html')) {
        return 'DEV HTML CONTENT';
      }
      throw new Error('File not found');
    });
    
    // Call the function
    const result = readHtmlFile('test.html');
    
    // Check results
    expect(result).toBe('DEV HTML CONTENT');
    expect(fs.existsSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('src/public/test.html'));
  });

  test('should read file from primary path in production environment', () => {
    // Set environment to production
    process.env.NODE_ENV = 'production';
    
    // Mock existsSync to return true for dist path
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      return path.includes('dist/public/test.html');
    });
    
    // Mock readFileSync to return expected content
    (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('dist/public/test.html')) {
        return 'PROD HTML CONTENT';
      }
      throw new Error('File not found');
    });
    
    // Call the function
    const result = readHtmlFile('test.html');
    
    // Check results
    expect(result).toBe('PROD HTML CONTENT');
    expect(fs.existsSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('dist/public/test.html'));
  });

  test('should try fallback path when primary path does not exist', () => {
    // Set environment to production
    process.env.NODE_ENV = 'production';
    
    // Mock existsSync to return false for primary path, true for fallback
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      return path.includes('src/public/test.html');
    });
    
    // Mock readFileSync to return content for fallback path
    (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('src/public/test.html')) {
        return 'FALLBACK HTML CONTENT';
      }
      throw new Error('File not found');
    });
    
    // Call the function
    const result = readHtmlFile('test.html');
    
    // Check results
    expect(result).toBe('FALLBACK HTML CONTENT');
    expect(fs.existsSync).toHaveBeenCalledTimes(2);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
  });

  test('should return default HTML template when no file exists', () => {
    // Mock existsSync to always return false
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Call the function
    const result = readHtmlFile('missing.html');
    
    // Check results
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('SNS Discord Forwarder');
    expect(result).toContain('missing.html');
    expect(fs.existsSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  test('should handle read errors and return default template', () => {
    // Mock existsSync to return true
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Mock readFileSync to throw an error
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Read error');
    });
    
    // Call the function
    const result = readHtmlFile('error.html');
    
    // Check results
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('SNS Discord Forwarder');
    expect(fs.existsSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
  });
}); 