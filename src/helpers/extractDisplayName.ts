import { Entity } from 'telegram/define';

const extractDisplayName = (entity: Entity) => {
  let displayName: string | undefined = undefined;

  switch (entity.className) {
    case 'Channel':
      displayName = entity.title;
      break;
    case 'User':
      displayName = entity.username || entity.lastName || entity.firstName;
      break;
    case 'Chat':
      displayName = entity.title;
      break;
    default:
      displayName = undefined;
      break;
  }

  return displayName;
};

export default extractDisplayName;
