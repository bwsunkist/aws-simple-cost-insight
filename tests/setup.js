// Jest setup file
// Enhanced Chart.js mock for testing
global.Chart = {
  register: jest.fn(),
  defaults: {
    font: { family: 'Arial', size: 12 },
    color: '#000000'
  },
  LineController: jest.fn(),
  BarController: jest.fn(),
  PieController: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  PointElement: jest.fn(),
  ArcElement: jest.fn(),
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn()
};

// Mock Chart constructor
global.Chart = jest.fn().mockImplementation(() => ({
  destroy: jest.fn(),
  update: jest.fn(),
  resize: jest.fn(),
  data: {},
  options: {}
}));

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