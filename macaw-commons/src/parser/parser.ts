import { Body } from '../model/body';

interface IParser<T extends Object> {

    parse(landmarks: T): Body;
}

export { IParser };