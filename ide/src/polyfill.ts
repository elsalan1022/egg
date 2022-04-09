import fill from 'buffer';

declare global {
  interface Window {
    Buffer: any;
  }
}

window.Buffer = fill.Buffer;
