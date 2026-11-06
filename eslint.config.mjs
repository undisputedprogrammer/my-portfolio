import { defineConfig, globalIgnores } from 'eslint/config';
import next from 'eslint-config-next/core-web-vitals';
import ts from 'eslint-config-next/typescript';
export default defineConfig([...next,...ts,{rules:{'react-hooks/set-state-in-effect':'off','react-hooks/refs':'off','react-hooks/immutability':'off'}},globalIgnores(['.next/**','out/**','qa/**','next-env.d.ts'])]);
