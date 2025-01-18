export interface Emulator {
  start(): void;
  stop(): void;
}

export interface Descriptor {
  ram: DataView;
  byteLength: number;

  registers: Register[];
}

export interface Register {
  name: string;
  byteLength: number;
  internal: boolean;

  read(): number;
  write(value: number): void;
}

export default {};
