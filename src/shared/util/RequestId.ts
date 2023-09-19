import { getRandomInt, leftPad } from './Util';

const runtimePrefix = leftPad(getRandomInt(240, 999), 3, '0');
let lastId = 0;

export function nextRequestId() {
  lastId++;
  return `${runtimePrefix}x${leftPad(lastId, 5, '0')}`;
}
