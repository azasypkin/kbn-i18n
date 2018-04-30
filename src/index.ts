import fg from 'fast-glob';
import chalk from 'chalk';
import { resolve } from 'path';
import { parse as parseJS } from './js';
import { parse as parseHTML } from './html';

const INCLUDED_PATHS = ['**/*.{js,html}', '**/*.{js,html}'];

const KIBANA_EXCLUDED_PATHS = [
  '!**/optimize/**',
  '!**/babel-register/**',
  '!**/es_archiver/**',
  '!**/dev/**',
  '!**/functional_test_runner/**',
  '!**/scripts/**',
  '!**/test_utils/**',
  '!**/kbn-plugin-generator/**',
  '!**/generator-kui/**',

  '!preinstall_check.js',

  '!**/build/**',
  '!**/dist/**',
  '!**/target/**',
  '!**/build_chromium/**',
  '!**/dev-tools/**',
  '!**/gulp_helpers/**',
  '!**/webpackShims/**',
  '!**/test/**',
  '!**/tests/**',
];

const COMMON_EXCLUDED_PATHS = [
  '!**/node_modules/**',
  '!**/__tests__/**',
  '!**/fixtures/**',
  '!**/*.test.js',
];

export async function run(argv: string[]) {
  if (argv.length === 0) {
    console.log(chalk.red('Kibana source directory should be specified.'));
    process.exit(1);
  }

  if (argv.length > 1) {
    console.log(
      chalk.red('Only a single Kibana source directory can be specified.')
    );
    process.exit(1);
  }

  const [kbnDirectory] = argv;

  const entries = (await fg(
    [...INCLUDED_PATHS, ...KIBANA_EXCLUDED_PATHS, ...COMMON_EXCLUDED_PATHS],
    {
      cwd: kbnDirectory,
    }
  )) as string[];

  const [htmlEntries, jsEntries] = entries.reduce(
    (files: [string[], string[]], entry) => {
      (entry.endsWith('.html') ? files[0] : files[1]).push(
        resolve(kbnDirectory, entry)
      );

      return files;
    },
    [[], []]
  );

  const htmlResult = await parseHTML(htmlEntries);
  const [htmlPhraseCount, htmlWordCount] = getStat(htmlResult.phrases);

  const jsResult = await parseJS(jsEntries);
  const [jsPhraseCount, jsWordCount] = getStat(jsResult.phrases);

  const [totalPhraseCount, totalWordCount] = getStat(
    new Map([...htmlResult.phrases.entries(), ...jsResult.phrases.entries()])
  );

  console.log(`
    ${chalk.green(
      chalk.bold('Total:')
    )} ${totalPhraseCount} unique phrases with ${totalWordCount} words
    ${chalk.green(
      chalk.bold('HTML:')
    )} ${htmlPhraseCount} unique phrases with ${htmlWordCount} words
    ${chalk.green(
      chalk.bold('JS/JSX:')
    )} ${jsPhraseCount} unique phrases with ${jsWordCount} words
  `);
}

function getStat(allPhrases: Map<string, Set<string>>): [number, number] {
  const wordRegex = /\s+/gi;

  const uniquePhrases: Set<string> = new Set();
  for (const phrases of allPhrases.values()) {
    for (const phrase of phrases) {
      uniquePhrases.add(phrase);
    }
  }

  return [
    uniquePhrases.size,
    [...uniquePhrases].reduce((count, phrase) => {
      return count + phrase.replace(wordRegex, ' ').split(' ').length;
    }, 0),
  ];
}
