import chalk from 'chalk';
import { parse as babylonParse } from 'babylon';
import { readFileSync } from 'fs';
import {
  BinaryExpression,
  isBinaryExpression,
  isModuleDeclaration,
  isJSXAttribute,
  isJSXIdentifier,
  isJSXNamespacedName,
  isStringLiteral,
  isTemplateLiteral,
} from 'babel-types';
import traverse, { Node, NodePath } from 'babel-traverse';
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
    let content;
    try {
      content = babylonParse(readFileSync(entry).toString('utf8'), {
        sourceType: 'module',
        plugins: [
          'jsx',
          'objectRestSpread',
          'classProperties',
          'asyncGenerators',
        ],
      });
    } catch (e) {
      console.log(chalk.red(`Error in ${entry.toString()}`));
      throw e;
    }

    traverse(content, {
      enter(path: NodePath<Node>) {
        if (
          isModuleDeclaration(path.parent) ||
          isBinaryExpression(path.parent) ||
          path.isModuleDeclaration()
        ) {
          return;
        }

        let phrase = '';
        if (path.isStringLiteral() && !isJSXAttribute(path.parent)) {
          phrase = path.node.value;
        } else if (path.isStringLiteral() && isJSXAttribute(path.parent)) {
          let attributeName = '';
          if (isJSXIdentifier(path.parent.name)) {
            attributeName = path.parent.name.name;
          } else if (isJSXNamespacedName(path.parent.name)) {
            attributeName = path.parent.name.name.name;
          }

          phrase = LOCALIZABLE_ATTRIBUTES.includes(attributeName)
            ? path.node.value
            : '';
        } else if (path.isTemplateLiteral()) {
          phrase = path.node.quasis.map(q => q.value.raw).join('');
        } else if (
          path.isBinaryExpression() &&
          validateBinaryExpression(path.node)
        ) {
          phrase = getBinaryExpressionValue(path.node);
        } else if (path.isJSXText()) {
          phrase = path.node.value;
        }

        addPhraseToResult(result, entry, phrase);
      },
    });

    print(result, entry);
  }

  return result;
}

function validateBinaryExpression(expression: BinaryExpression) {
  const validate = (side: Node): boolean => {
    if (isBinaryExpression(side) && side.operator === '+') {
      return validateBinaryExpression(side);
    }

    return isStringLiteral(side) || isTemplateLiteral(side);
  };

  return validate(expression.left) && validate(expression.right);
}

function getBinaryExpressionValue(node: Node): string {
  if (isStringLiteral(node)) {
    return node.value;
  }

  if (isTemplateLiteral(node)) {
    return node.quasis.map(q => q.value.raw).join('');
  }

  if (isBinaryExpression(node) && node.operator === '+') {
    return `${getBinaryExpressionValue(node.left)}${getBinaryExpressionValue(
      node.right
    )}`;
  }

  return '';
}
