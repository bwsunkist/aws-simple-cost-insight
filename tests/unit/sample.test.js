// Sample test to verify Jest setup
describe('Jest Setup', () => {
  test('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should have Chart.js mock available', () => {
    expect(global.Chart).toBeDefined();
    expect(typeof global.Chart.register).toBe('function');
  });

  test('should have File API mocks available', () => {
    expect(global.File).toBeDefined();
    expect(global.FileReader).toBeDefined();
  });
});