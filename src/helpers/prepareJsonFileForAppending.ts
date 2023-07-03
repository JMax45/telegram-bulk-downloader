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

  /**
   * Should be refactored, the BUF_LENGTH = 100 is an arbitrary number to account for potential newlines at the end of the file.
   * It will fail if there's a file with 101 newlines. There should instead be a loop that starts at the end of the file and goes
   * chunk by chunk until available data ends.
   */
  const BUF_LENGTH = 100;
  const buffer = Buffer.alloc(BUF_LENGTH);
  const data = await promisify(read)(
    fd,
    buffer,
    0,
    BUF_LENGTH,
    stats.size - BUF_LENGTH
  );
  const charIndex = data.buffer.toString().lastIndexOf(']');
  if (data.buffer.toString().charAt(charIndex) !== ']')
    throw new Error(`Failed to verify ${filePath} integrity`);

  await promisify(write)(
    fd,
    Buffer.from(replacer),
    0,
    replacer.length,
    stats.size - data.bytesRead + charIndex
  );

  if (stats.size - data.bytesRead + charIndex <= stats.size)
    await promisify(truncate)(
      filePath,
      stats.size - data.bytesRead + charIndex + 1
    );
};

export default prepareJsonFileForAppending;
