export interface CompositeObject {
  name: string;
  attributes: Map<string, string>;
  children: CompositeObject[];
}
