import { rmSync } from 'node:fs';
import { defineConfig, type Format, type Options } from 'tsup';
import { createProgram } from 'typescript';

const entry: string[] = ['./src/index.ts'];
const outDir: string = './dist';
const declarationDir: string = './types';
const excludedDeclarationFiles: string[] = ['build-state-manager.class.d.ts'];

export default defineConfig({
  entry,
  outDir,
  format: ['cjs', 'esm'],
  clean: true,
  outExtension: ({ format }: { format: Format }): { js: string } => ({
    js: format === 'cjs' ? '.cjs' : '.mjs',
  }),
  onSuccess: async (): Promise<void> => {
    await new Promise<void>(
      (resolve: (value: void | PromiseLike<void>) => void, reject: (reason?: unknown) => void): void => {
        try {
          rmSync(declarationDir, { recursive: true, force: true });

          createProgram(entry, {
            extends: './tsconfig.json',
            declaration: true,
            declarationDir,
            emitDeclarationOnly: true,
          }).emit();

          excludedDeclarationFiles.forEach((file: string): void =>
            rmSync(`./${declarationDir}/${file}`, { force: true }),
          );

          resolve();
        } catch (error) {
          console.error('Declaration file generation failed:', error);

          reject(
            !(error instanceof Error)
              ? new Error(`Unknown error during declaration file generation: ${String(error)}`)
              : error,
          );
        }
      },
    );
  },
} satisfies Options);
