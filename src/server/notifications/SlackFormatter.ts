export class SlackFormatter {
  static asTitledList(title: string, rows: string[]) {
    return `*${title}*\n${rows.map(r => `- ${r}`).join('\n')}`;
  }
}
