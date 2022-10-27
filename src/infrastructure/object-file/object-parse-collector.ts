import { CompositeObject } from './composite-object';
import { ObjectParseHandler } from './object-parse-handler';

export class ObjectParseCollector implements ObjectParseHandler {
  private root: CompositeObject;

  public constructor() {
    this.root = {
      name: '',
      attributes: new Map(),
      children: [],
    };
  }

  public handleObjectParse(parent: CompositeObject, child: CompositeObject) {
    if (!parent) {
      this.root.children.push(child);
      return;
    }
    parent.children.push(child);
  }

  public getRoot(): CompositeObject {
    return this.root;
  }
}
