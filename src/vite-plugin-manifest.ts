import type { Plugin, ResolvedConfig } from "vite";
import { Project, SyntaxKind } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

export function manifestPlugin(): Plugin {
  let config: ResolvedConfig;
  let outDir: string;

  return {
    name: "@journal/manifest",
    configResolved(resolved) {
      config = resolved;
      outDir = path.resolve(config.root, resolved.build.outDir || "dist");
    },
    closeBundle() {
      const manifestPath = path.resolve(config.root, "src/manifest.ts");
      if (!fs.existsSync(manifestPath)) return;

      try {
        const project = new Project();
        const sourceFile = project.addSourceFileAtPath(manifestPath);
        const manifestExport = sourceFile
          .getExportedDeclarations()
          .get("manifest");
        if (!manifestExport || manifestExport.length === 0) return;

        const initializer = (manifestExport[0] as any).getInitializer?.();
        if (!initializer) return;

        const manifestObj = extractObjectValue(initializer);
        if (!manifestObj) return;

        manifestObj.$schema = "https://json-schema.org/draft-07/schema";
        const json = JSON.stringify(manifestObj, null, 2);

        if (!fs.existsSync(outDir))
          fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(
          path.resolve(outDir, "manifest.json"),
          json,
          "utf-8",
        );
      } catch (err) {
        config.logger.error(`Failed to generate manifest: ${err}`);
      }
    },
  };
}

function nodeKind(n: any): number {
  if (!n || typeof n.getKind !== "function") return -1;
  return n.getKind();
}

function extractObjectValue(
  node: any,
): Record<string, unknown> | null {
  const k = nodeKind(node);

  if (
    k === SyntaxKind.AsExpression ||
    k === SyntaxKind.SatisfiesExpression ||
    k === SyntaxKind.ParenthesizedExpression
  ) {
    return extractObjectValue(node.getExpression());
  }

  if (k === SyntaxKind.CallExpression) {
    const args = node.getArguments();
    if (args && args.length > 0) {
      return extractObjectValue(args[0]);
    }
    return null;
  }

  if (k !== SyntaxKind.ObjectLiteralExpression) return null;

  const result: Record<string, unknown> = {};
  const props = node.getProperties() ?? [];
  for (const prop of props) {
    if (nodeKind(prop) !== SyntaxKind.PropertyAssignment) continue;
    result[prop.getName()] = extractLiteralValue(prop.getInitializer());
  }
  return result;
}

function extractLiteralValue(node: any): unknown {
  const k = nodeKind(node);

  if (
    k === SyntaxKind.AsExpression ||
    k === SyntaxKind.SatisfiesExpression ||
    k === SyntaxKind.ParenthesizedExpression
  ) {
    return extractLiteralValue(node.getExpression());
  }

  if (k === SyntaxKind.CallExpression) {
    const args = node.getArguments();
    if (args && args.length > 0) {
      return extractLiteralValue(args[0]);
    }
    return null;
  }

  switch (k) {
    case SyntaxKind.StringLiteral:
      return node.getText().slice(1, -1);
    case SyntaxKind.NumericLiteral:
      return Number(node.getText());
    case SyntaxKind.TrueKeyword:
      return true;
    case SyntaxKind.FalseKeyword:
      return false;
    case SyntaxKind.ObjectLiteralExpression:
      return extractObjectValue(node);
    case SyntaxKind.ArrayLiteralExpression: {
      const elements = node.getElements() ?? [];
      return elements.map((e: any) => extractLiteralValue(e));
    }
    default:
      return node.getText();
  }
}
