declare module 'process' {
  interface Process {
    env: Record<string, string | undefined>;
    browser: boolean;
    version: string;
    versions: Record<string, string>;
    platform: string;
    nextTick: (callback: () => void) => void;
  }
  const process: Process;
  export default process;
}

declare module 'process/browser' {
  interface Process {
    env: Record<string, string | undefined>;
    browser: boolean;
    version: string;
    versions: Record<string, string>;
    platform: string;
    nextTick: (callback: () => void) => void;
  }
  const process: Process;
  export default process;
}

declare module 'crypto-browserify' {
  interface Crypto {
    createHash: (algorithm: string) => {
      update: (data: string | Buffer) => void;
      digest: (encoding?: string) => string | Buffer;
    };
    randomBytes: (size: number) => Buffer;
    createCipher: (algorithm: string, password: string) => unknown;
    createDecipher: (algorithm: string, password: string) => unknown;
  }
  const crypto: Crypto;
  export default crypto;
}

declare module 'buffer' {
  interface BufferConstructor {
    from: (data: string | number[] | ArrayBuffer, encoding?: string) => Buffer;
    alloc: (size: number, fill?: string | number) => Buffer;
    isBuffer: (obj: unknown) => obj is Buffer;
  }
  export const Buffer: BufferConstructor;
}
