declare module 'json2csv' {
  export class Parser<T = unknown> {
    constructor(opts?: { fields?: Array<string | { label: string; value: string }> });
    parse(data: T | T[]): string;
  }
}
