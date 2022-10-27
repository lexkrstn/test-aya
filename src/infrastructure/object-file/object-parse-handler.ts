import { CompositeObject } from './composite-object';

export interface ObjectParseHandler {
  handleObjectParse(
    parent: CompositeObject,
    child: CompositeObject,
  ): Promise<void> | void;
}
