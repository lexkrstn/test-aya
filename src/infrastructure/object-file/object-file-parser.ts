import { createReadStream } from 'fs';
import { createInterface, Interface } from 'readline';
import { Readable } from 'stream';
import { CompositeObject } from './composite-object';
import { ObjectParseCollector } from './object-parse-collector';
import { ObjectParseHandler } from './object-parse-handler';

const OBJECT_NAME_REGEX = /^[A-Z][a-zA-Z_\-0-9]*$/;
const ATTRIBUTE_REGEX = /^([a-z][a-zA-Z_0-9]*):\s*(.*)$/;

export class ObjectFileParser {
  private reader: Interface;
  private handler: ObjectParseHandler;
  private stack: CompositeObject[] = [];
  private tabSize = 2;
  private readPauseCount = 0;

  public static fromPath(
    pathName: string,
    handler: ObjectParseHandler,
    encoding: BufferEncoding = 'utf-8',
  ) {
    return new ObjectFileParser(createReadStream(pathName, encoding), handler);
  }

  public static fromString(str: string, handler: ObjectParseHandler) {
    const readable = new Readable();
    const parser = new ObjectFileParser(readable, handler);
    readable.push(str);
    readable.push(null);
    return parser;
  }

  public static async collectFromString(str: string) {
    const collector = new ObjectParseCollector();
    const parser = ObjectFileParser.fromString(str, collector);
    await parser.parse();
    return collector.getRoot();
  }

  public constructor(
    stream: NodeJS.ReadableStream,
    handler: ObjectParseHandler,
  ) {
    this.reader = createInterface(stream);
    this.handler = handler;
  }

  public async parse() {
    let lineNo = 1;
    await new Promise((resolve, reject) => {
      this.reader.on('line', (line) => {
        try {
          this.parseLine(line, lineNo++);
        } catch (err) {
          reject(err);
        }
      });
      this.reader.on('close', resolve);
      this.reader.on('error', reject);
    });
    // Call handlers for the objects that are still 'open'.
    this.reduceStackSize(0);
  }

  private parseLine(line: string, lineNo: number) {
    if (line.trim() === '') {
      return;
    }
    const tabs = this.parseTabs(line, lineNo);
    const parentTabs = this.stack.length;
    if (tabs - parentTabs > 1) {
      throw new Error(`Invalid offset on line ${lineNo}`);
    }
    if (tabs < parentTabs) {
      // 'close' some nested levels
      this.reduceStackSize(tabs);
      this.parseNestedAttributeOrObjectName(line, lineNo);
    } else if (tabs > parentTabs) {
      // nested object
      const object = ObjectFileParser.parseObjectName(line, lineNo);
      this.stack.push(object);
    } else if (tabs === 0) {
      // a root object
      const object = ObjectFileParser.parseObjectName(line, lineNo);
      this.stack = [object];
    } else {
      this.parseNestedAttributeOrObjectName(line, lineNo);
    }
  }

  private async reduceStackSize(newSize: number) {
    const promises: (Promise<void> | void)[] = [];
    for (let i = this.stack.length - 1; i >= newSize; i--) {
      promises.push(
        this.handler.handleObjectParse(
          i > 0 ? this.stack[i - 1] : null, // parent
          this.stack[i],
        ),
      );
      this.stack.pop();
    }
    // Calling pause() does not immediately pause other events, including the 'line'
    if (this.readPauseCount++ === 0) {
      this.reader.pause();
    }
    await Promise.all(promises);
    if (--this.readPauseCount === 0) {
      this.reader.resume();
    }
  }

  private parseNestedAttributeOrObjectName(line: string, lineNo: number) {
    const content = line.trim();
    if (content === '') {
      return;
    }
    const parent = this.stack[this.stack.length - 1];
    // Try to parse object name
    if (OBJECT_NAME_REGEX.test(content)) {
      this.stack.push(ObjectFileParser.parseObjectName(line, lineNo));
      return;
    }
    // Try to parse attribute
    const match = content.match(ATTRIBUTE_REGEX);
    if (!match) {
      throw new Error(`Malformed on line ${lineNo}`);
    }
    parent.attributes.set(match[1], match[2]);
  }

  private static parseObjectName(
    line: string,
    lineNo: number,
  ): CompositeObject {
    const name = line.trim();
    if (name === '') {
      throw new Error(`Empty object name on line ${lineNo}`);
    }
    if (!OBJECT_NAME_REGEX.test(name)) {
      throw new Error(`Invalid object name format "${name}" on line ${lineNo}`);
    }
    return {
      name,
      attributes: new Map(),
      children: [],
    };
  }

  /**
   * Returns number of tabs.
   */
  private parseTabs(line: string, lineNo: number): number {
    let i = 0;
    while (i < line.length) {
      if (line[i] != ' ') {
        break;
      }
      i++;
    }
    if (i % this.tabSize !== 0) {
      throw new Error(`Invalid offset on line ${lineNo}`);
    }
    return i / this.tabSize;
  }
}
