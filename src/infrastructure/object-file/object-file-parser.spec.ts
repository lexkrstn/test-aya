import { ObjectFileParser } from './object-file-parser';

describe('ObjectFileParser', () => {
  it('should parse', async () => {
    const root = await ObjectFileParser.collectFromString(
      'E-List\n' +
        '  Employee\n' +
        '    id: 45287\n' +
        '    name: Kamron\n' +
        '    surname: Cummerata\n' +
        '\n' +
        '    Department\n' +
        '      id: 53694\n' +
        '      name: Kids\n' +
        '  Employee\n' +
        '    id: 45288\n' +
        '    name: Kamron2\n' +
        '    surname: Cummerata2\n' +
        '\n' +
        '    Department\n' +
        '      id: 53694\n' +
        '      name: Kids\n' +
        'Rates\n' +
        '  Rate\n' +
        '    date: Sun Feb 28 2021\n' +
        '    sign: AUD\n' +
        '    value: 0.7695000000000001',
    );

    expect(root.children.length).toBe(2);
    expect(root.children[0].name).toBe('E-List');
    expect(root.children[0].children.length).toBe(2);
    expect(root.children[0].children[0].name).toBe('Employee');
    expect(root.children[0].children[0].attributes.get('id')).toBe('45287');
    expect(root.children[0].children[0].attributes.get('name')).toBe('Kamron');
    expect(root.children[0].children[0].attributes.get('surname')).toBe(
      'Cummerata',
    );
    expect(root.children[0].children[1].children[0].name).toBe('Department');
    expect(root.children[0].children[1].attributes.get('id')).toBe('45288');
    expect(root.children[0].children[1].children[0].attributes.get('id')).toBe(
      '53694',
    );
    expect(
      root.children[0].children[1].children[0].attributes.get('name'),
    ).toBe('Kids');
    expect(root.children[1].name).toBe('Rates');
  });
});
