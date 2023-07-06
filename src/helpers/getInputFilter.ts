import { Api } from 'telegram';
import MediaType from '../types/MediaType';

const getInputFilter = (userInput: MediaType) => {
  return new Api[userInput]();
};

export default getInputFilter;
