// Jest setup file
// Mock Chart.js for testing
global.Chart = {
  register: jest.fn(),
  Chart: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    update: jest.fn(),
    resize: jest.fn()
  }))
};

// Mock File API
global.File = class File {
  constructor(bits, name, options = {}) {
    this.bits = bits;
    this.name = name;
    this.type = options.type || '';
    this.size = bits.reduce((acc, bit) => acc + bit.length, 0);
  }
};

global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
  }
  
  readAsText(file) {
    this.readyState = 2;
    this.result = file.bits.join('');
    setTimeout(() => this.onload && this.onload(), 0);
  }
};

// Mock fetch for loading CSV files
global.fetch = jest.fn();

// Console warnings for missing implementations
console.warn = jest.fn();