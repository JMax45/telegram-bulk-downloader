import { appendFile, open, read, stat, truncate, write, writeFile } from 'fs';
import { promisify } from 'util';
import AsyncQueue from './AsyncQueue';

class JsonSerializer {
  private filePath: string;
  private queue: AsyncQueue;
  constructor(filePath: string) {
    this.filePath = filePath;
    this.queue = new AsyncQueue();
  }
  async append(data: any) {
    this.queue.enqueue(async () => {
      await this.prepareJsonFileForAppending();
      const jsonString = JSON.stringify(data);
      await promisify(appendFile)(this.filePath, jsonString + ']');
    });
  }
  private prepareJsonFileForAppending = async () => {
    let replacer = ',';
    let stats;
    try {
      stats = await promisify(stat)(this.filePath);
    } catch (err) {
      await promisify(writeFile)(this.filePath, '[]');
      stats = await promisify(stat)(this.filePath);
    }
    const fd = await promisify(open)(this.filePath, 'r+');

    const BUF_LENGTH = 10;
    const buffer = Buffer.alloc(BUF_LENGTH);
    let position = stats.size;
    let charIndex = -1;

    while (position + BUF_LENGTH > -1 && charIndex <= -1) {
      const data = await promisify(read)(fd, buffer, 0, BUF_LENGTH, position);
      charIndex = data.buffer.toString().lastIndexOf(']');
      if (charIndex > -1) break;
      // If position was 0, we read the whole file, break from loop
      if (position <= 0) break;
      position = position - BUF_LENGTH;
      // If position goes below 0, set it to 0, otherwise will crash on Windows
      if (position < 0) position = 0;
    }

    if (position <= -1) position = 0;

    if (charIndex <= -1)
      throw new Error(`Failed to verify ${this.filePath} integrity`);

    const buffer2 = Buffer.alloc(1);
    const charBeforePos = await (
      await promisify(read)(fd, buffer2, 0, 1, position + charIndex - 1)
    ).buffer.toString();

    if (charBeforePos === '[') {
      replacer = ' ';
    }

    await promisify(write)(
      fd,
      Buffer.from(replacer),
      0,
      replacer.length,
      position + charIndex
    );

    if (position + charIndex + 1 <= stats.size)
      await promisify(truncate)(this.filePath, position + charIndex + 1);
  };
}

export default JsonSerializer;
