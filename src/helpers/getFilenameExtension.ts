import { Api } from 'telegram';
import mime from 'mime-types';

const getFilenameExtension = (msg: Api.Message) => {
  switch (msg.media?.className) {
    case 'MessageMediaPhoto':
      return 'jpg';
    case 'MessageMediaDocument':
      if (
        msg.media.document?.className === 'Document' &&
        typeof mime.extension(msg.media.document.mimeType) === 'string'
      )
        return mime.extension(msg.media.document.mimeType) as string;
    default:
      throw new Error('Failed to extract extension');
  }
};

export default getFilenameExtension;
