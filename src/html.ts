import chalk from 'chalk';
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import {
  addPhraseToResult,
  LOCALIZABLE_ATTRIBUTES,
  Result,
  print,
} from './common';

export async function parse(entries: string[]): Promise<Result> {
  const result: Result = {
    phrases: new Map(),
    ignored: new Map(),
  };

  for (const entry of entries) {
    let document;
    try {
      document = (new JSDOM(readFileSync(entry.toString())).window as any)
        .document;
    } catch (e) {
      console.log(chalk.red(`Error in ${entry.toString()}`));
      throw e;
    }

    for (const node of document.getElementsByTagName('*')) {
      const phrases: string[] = node.textContent ? [node.textContent] : [];
      for (const attributeName of LOCALIZABLE_ATTRIBUTES) {
        const attributeContent = node.getAttribute(attributeName);
        if (attributeContent) {
          phrases.push(attributeContent);
        }
      }

      for (const phrase of phrases) {
        addPhraseToResult(result, entry, phrase);
      }
    }

    print(result, entry);
  }

  return result;
}
