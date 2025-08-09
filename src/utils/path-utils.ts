import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * プロジェクトルートディレクトリを取得する
 * package.jsonの存在を基準にプロジェクトルートを特定
 */
export async function findProjectRoot(startPath?: string): Promise<string> {
  let currentDir = startPath || path.dirname(fileURLToPath(import.meta.url));
  
  // 上位ディレクトリを辿ってpackage.jsonを探す
  while (currentDir !== path.dirname(currentDir)) {
    try {
      const packageJsonPath = path.join(currentDir, 'package.json');
      await fs.access(packageJsonPath);
      return currentDir;
    } catch {
      currentDir = path.dirname(currentDir);
    }
  }
  
  throw new Error('Could not find project root (package.json not found)');
}

/**
 * プロジェクトルートからの相対パスを解決する
 */
export async function resolveFromProjectRoot(...pathSegments: string[]): Promise<string> {
  const projectRoot = await findProjectRoot();
  return path.join(projectRoot, ...pathSegments);
}

/**
 * 現在のファイルの場所からプロジェクトルートを取得する
 */
export async function getProjectRootFromCurrentFile(currentFileUrl: string): Promise<string> {
  const currentFilePath = fileURLToPath(currentFileUrl);
  const startPath = path.dirname(currentFilePath);
  return findProjectRoot(startPath);
}