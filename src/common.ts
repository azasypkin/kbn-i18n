import chalk from 'chalk';

export const LOCALIZABLE_ATTRIBUTES = [
  'accesskey',
  'abbr',
  'alt',
  'aria-label',
  'aria-valuetext',
  'download',
  'label',
  'placeholder',
  'title',
  'tooltip',
];

export function sanitize(text: string) {
  if (!text) {
    return null;
  }

  text = text.replace(/[.,?!:;'"`]$/g, '').trim();

  // Filter out angular interpolations.
  if (
    text.startsWith('{{') &&
    text.endsWith('}}') &&
    text.lastIndexOf('{{') === 0
  ) {
    return null;
  }

  if (
    text.startsWith('{') &&
    text.endsWith('}') &&
    text.lastIndexOf('{') === 0
  ) {
    return null;
  }

  // Filter out tmpl interpolations.
  if (text.startsWith('<%') && text.endsWith('%>')) {
    return null;
  }

  // Check for special single words.
  if (text.split(' ').length === 1) {
    if (!isNaN(text as any) || text.startsWith('#') || text.startsWith('$')) {
      return null;
    }

    // Likely a variable name or path.
    if (/[_/=:\[\]]/g.test(text) || text.includes('--')) {
      return null;
    }

    // Check for camel case variable names.
    if (text.slice(1).toLowerCase() !== text.slice(1)) {
      return null;
    }

    // Same here.
    const dotIndex = text.lastIndexOf('.');
    if (dotIndex >= 0 && dotIndex < text.length - 1) {
      return null;
    }
  }

  return text.length > 1 ? text.trim() : null;
}

export interface Result {
  phrases: Map<string, Set<string>>;
  ignored: Map<string, Set<string>>;
}

export function addPhraseToResult(
  result: Result,
  path: string,
  unsanitizedPhrase?: string
) {
  if (unsanitizedPhrase == null) {
    return;
  }

  unsanitizedPhrase
    .trim()
    .split(/(\s){3}|(\n)/g)
    .forEach(phrase => {
      if (!phrase || !phrase.trim()) {
        return;
      }

      const sanitizedPhrase = sanitize(phrase.trim());

      if (sanitizedPhrase === null) {
        let ignoredPhrases = result.ignored.get(path);
        if (ignoredPhrases === undefined) {
          ignoredPhrases = new Set();
          result.ignored.set(path, ignoredPhrases);
        }

        ignoredPhrases.add(phrase.trim());
      } else {
        let phrases = result.phrases.get(path);
        if (phrases === undefined) {
          phrases = new Set();
          result.phrases.set(path, phrases);
        }

        phrases.add(sanitizedPhrase);
      }
    });
}

export function print(result: Result, path: string) {
  const phrases = result.phrases.get(path);
  const ignoredPhrases = result.ignored.get(path);
  if (phrases === undefined && ignoredPhrases === undefined) {
    return;
  }

  console.log(`---${chalk.bold(chalk.yellow(path))}---`);
  if (phrases !== undefined) {
    for (const phrase of phrases) {
      console.log(chalk.green(`✔ ${phrase}`));
    }
  }

  if (ignoredPhrases !== undefined) {
    for (const phrase of ignoredPhrases) {
      console.log(chalk.red(`✖ ${phrase}`));
    }
  }
}
