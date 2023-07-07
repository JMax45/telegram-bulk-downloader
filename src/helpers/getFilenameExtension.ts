import { Api } from 'telegram';
import mime from 'mime-types';

const extractExtensionFromFilename = (filename: string) => {
  const split = filename.split('.');
  if (split.length <= 1) return false;
  return split[split.length - 1];
};

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
      if (
        msg.media.document?.className === 'Document' &&
        msg.media.document.attributes
      ) {
        const attribute = msg.media.document.attributes.find(
          (e) => e.className === 'DocumentAttributeFilename'
        ) as Api.DocumentAttributeFilename | undefined;
        if (attribute)
          return extractExtensionFromFilename(attribute.fileName) || '';
      }
    default:
      throw new Error('Failed to extract extension');
  }
};

export default getFilenameExtension;
