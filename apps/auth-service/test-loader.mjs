import { resolve as pathResolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    if (context.parentURL) {
      const parentPath = fileURLToPath(context.parentURL);
      const targetPath = pathResolve(pathResolve(parentPath, '..'), specifier);

      if (existsSync(targetPath + '.ts')) {
        return {
          shortCircuit: true,
          url: pathToFileURL(targetPath + '.ts').href,
        };
      }
      if (existsSync(targetPath + '/index.ts')) {
        return {
          shortCircuit: true,
          url: pathToFileURL(targetPath + '/index.ts').href,
        };
      }
    }
  }
  return nextResolve(specifier, context);
}
