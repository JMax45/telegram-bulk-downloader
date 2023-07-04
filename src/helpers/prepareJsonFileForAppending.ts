import { open, read, stat, truncate, write } from 'fs';
import { promisify } from 'util';

/**
 * Temporary method that will be used for creating a custom JSON streamer.
 * This method removes the ']' at the end of a JSON file and adds a ',' to allow data appending.
 * Please note that this method is not foolproof and may lead to data corruption.
 * It doesn't perform complete data verification, so use with caution.
 * This method should help with efficiency in handling large JSON objects without parsing and serializing the entire object.
 * The metadata.json can grow up to 8.2MB with 1000 files.
 */

const prepareJsonFileForAppending = async (
  filePath: string,
  replacer: string
) => {
  const stats = await promisify(stat)(filePath);
  const fd = await promisify(open)(filePath, 'r+');

  const BUF_LENGTH = 10;
  const buffer = Buffer.alloc(BUF_LENGTH);
  let position = stats.size;
  let charIndex = -1;

  while (position > -1 && charIndex <= -1) {
    const data = await promisify(read)(fd, buffer, 0, BUF_LENGTH, position);
    charIndex = data.buffer.toString().lastIndexOf(']');
    position = position - BUF_LENGTH;
  }

  if (charIndex <= -1)
    throw new Error(`Failed to verify ${filePath} integrity`);

  await promisify(write)(
    fd,
    Buffer.from(replacer),
    0,
    replacer.length,
    position + BUF_LENGTH + charIndex
  );

  if (position + BUF_LENGTH + charIndex <= stats.size)
    await promisify(truncate)(filePath, position + BUF_LENGTH + charIndex + 1);
};

export default prepareJsonFileForAppending;
