import eslint from '@eslint/js';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig, globalIgnores } from 'eslint/config';
import tslint from 'typescript-eslint';

export default defineConfig(globalIgnores(['./coverage/', './dist/', './types/']), {
  extends: [eslint.configs.recommended, ...tslint.configs.recommendedTypeChecked, prettierRecommended],
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.js'],
      },
    },
  },
});
