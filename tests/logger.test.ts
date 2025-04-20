import { logger } from '../src/utils/logger';

describe('logger', () => {
  it('should log info without throwing', () => {
    expect(() => logger.info('test info')).not.toThrow();
  });
  it('should log warn without throwing', () => {
    expect(() => logger.warn('test warn')).not.toThrow();
  });
  it('should log error without throwing', () => {
    expect(() => logger.error('test error')).not.toThrow();
  });
  it('should log debug without throwing', () => {
    expect(() => logger.debug('test debug')).not.toThrow();
  });
}); 