#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Find the latest airconsole-X.Y.Z.js file in the repository
 * Prioritizes root > beta > deprecated directories
 */
function findLatestAirConsoleFile() {
  const patterns = [
    './airconsole-*.js',
    './beta/airconsole-*.js',
    './deprecated/airconsole-*.js'
  ];
  
  let allFiles = [];
  
  for (const pattern of patterns) {
    try {
      const files = execSync(`find . -name "${pattern.split('/').pop()}" -path "${pattern.replace('*', '*')}"`, 
        { encoding: 'utf8', cwd: process.cwd() })
        .trim()
        .split('\n')
        .filter(f => f.length > 0);
      
      allFiles = allFiles.concat(files.map(file => ({
        path: file,
        priority: pattern.includes('./airconsole-') ? 0 : pattern.includes('./beta/') ? 1 : 2
      })));
    } catch (e) {
      // Ignore if pattern not found
    }
  }
  
  if (allFiles.length === 0) {
    throw new Error('No airconsole-*.js files found');
  }
  
  // Sort by priority (root first), then by version
  allFiles.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    
    // Extract version numbers for comparison
    const aVersion = a.path.match(/airconsole-(\d+\.\d+\.\d+)\.js$/);
    const bVersion = b.path.match(/airconsole-(\d+\.\d+\.\d+)\.js$/);
    
    if (aVersion && bVersion) {
      const aVersionParts = aVersion[1].split('.').map(Number);
      const bVersionParts = bVersion[1].split('.').map(Number);
      
      for (let i = 0; i < 3; i++) {
        if (aVersionParts[i] !== bVersionParts[i]) {
          return bVersionParts[i] - aVersionParts[i]; // Descending order
        }
      }
    }
    
    return 0;
  });
  
  return allFiles[0];
}

/**
 * Extract version from a file path
 */
function extractVersion(filePath) {
  const match = filePath.match(/airconsole-(\d+\.\d+\.\d+)\.js$/);
  return match ? match[1] : null;
}

/**
 * Update package.json with the detected version
 */
function updatePackageVersion(version) {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageJson.version = version;
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`Updated package.json version to ${version}`);
}

/**
 * Generate TypeScript declarations by parsing JSDoc manually
 */
function generateTypeScriptDeclarations(sourceFile, outputFile) {
  console.log(`Generating TypeScript declarations from ${sourceFile}...`);
  
  try {
    const content = fs.readFileSync(sourceFile, 'utf8');
    const declarations = parseJSDocToTypeScript(content);
    
    // Write to index.d.ts
    fs.writeFileSync(outputFile, declarations);
    
    console.log(`Generated ${outputFile}`);
  } catch (error) {
    console.error('Error generating TypeScript declarations:', error.message);
    throw error;
  }
}

/**
 * Parse JSDoc comments and convert to TypeScript declarations
 */
function parseJSDocToTypeScript(content) {
  const lines = content.split('\n');
  let declarations = generateHeader();
  
  let currentComment = '';
  let inComment = false;
  let braceDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Track JSDoc comments
    if (line.startsWith('/**')) {
      currentComment = line;
      inComment = true;
      continue;
    }
    
    if (inComment) {
      currentComment += '\n' + line;
      if (line.includes('*/')) {
        inComment = false;
        
        // Check next non-empty line for function/constructor
        const nextLine = findNextNonEmptyLine(lines, i + 1);
        if (nextLine) {
          const declaration = parseJSDocBlock(currentComment, nextLine);
          if (declaration) {
            declarations += declaration + '\n\n';
          }
        }
        currentComment = '';
      }
      continue;
    }
  }
  
  declarations += generateFooter();
  return declarations;
}

/**
 * Find the next non-empty, non-comment line
 */
function findNextNonEmptyLine(lines, startIndex) {
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
      return line;
    }
  }
  return null;
}

/**
 * Parse a JSDoc block and associated code to generate TypeScript declarations
 */
function parseJSDocBlock(comment, codeLine) {
  const tags = extractJSDocTags(comment);
  
  // Handle constructor
  if (tags.constructor && codeLine.includes('function AirConsole')) {
    return generateConstructorDeclaration(tags);
  }
  
  // Handle typedef
  if (tags.typedef) {
    return generateTypedefDeclaration(tags);
  }
  
  // Handle regular functions/methods
  if (codeLine.includes('function') || codeLine.includes('AirConsole.prototype.')) {
    return generateMethodDeclaration(tags, codeLine);
  }
  
  // Handle constants
  if (codeLine.includes('AirConsole.') && (codeLine.includes(' = ') || codeLine.includes(': '))) {
    return generateConstantDeclaration(tags, codeLine);
  }
  
  return null;
}

/**
 * Extract JSDoc tags from a comment block
 */
function extractJSDocTags(comment) {
  const tags = {};
  const lines = comment.split('\n');
  
  let currentTag = null;
  let currentContent = '';
  
  for (const line of lines) {
    const trimmed = line.replace(/^\s*\*\s?/, '');
    
    if (trimmed.startsWith('@')) {
      // Save previous tag
      if (currentTag) {
        if (!tags[currentTag]) tags[currentTag] = [];
        if (Array.isArray(tags[currentTag])) {
          tags[currentTag].push(currentContent.trim());
        } else {
          tags[currentTag] = [tags[currentTag], currentContent.trim()];
        }
      }
      
      // Start new tag
      const tagMatch = trimmed.match(/^@(\w+)(?:\s+(.*))?/);
      if (tagMatch) {
        currentTag = tagMatch[1];
        currentContent = tagMatch[2] || '';
      }
    } else if (currentTag && trimmed) {
      currentContent += ' ' + trimmed;
    } else if (!currentTag && trimmed) {
      // Description
      if (!tags.description) tags.description = [];
      tags.description.push(trimmed);
    }
  }
  
  // Save last tag
  if (currentTag) {
    if (!tags[currentTag]) tags[currentTag] = [];
    if (Array.isArray(tags[currentTag])) {
      tags[currentTag].push(currentContent.trim());
    } else {
      tags[currentTag] = [tags[currentTag], currentContent.trim()];
    }
  }
  
  return tags;
}

/**
 * Generate TypeScript constructor declaration
 */
function generateConstructorDeclaration(tags) {
  const params = (tags.param || []).map(parseParam);
  const paramList = params.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ');
  
  const description = (tags.description || []).join(' ');
  
  return `/**
 * ${description}
 */
interface AirConsoleConstructor {
  new (${paramList}): AirConsoleObject;
}`;
}

/**
 * Generate TypeScript typedef declaration
 */
function generateTypedefDeclaration(tags) {
  const typedef = tags.typedef[0];
  const match = typedef.match(/\{(\w+)\}\s+(\w+)/);
  if (!match) return null;
  
  const [, type, name] = match;
  const properties = (tags.property || []).map(parseProperty);
  
  const description = (tags.description || []).join(' ');
  
  if (properties.length > 0) {
    const propList = properties.map(p => 
      `  /** ${p.description} */\n  ${p.name}${p.optional ? '?' : ''}: ${p.type};`
    ).join('\n');
    
    return `/**
 * ${description}
 */
interface ${name} {
${propList}
}`;
  } else {
    return `/**
 * ${description}
 */
type ${name} = ${type};`;
  }
}

/**
 * Generate TypeScript method declaration
 */
function generateMethodDeclaration(tags, codeLine) {
  const methodName = extractMethodName(codeLine);
  if (!methodName) return null;
  
  const params = (tags.param || []).map(parseParam);
  const returns = tags.return ? parseReturn(tags.return[0]) : 'void';
  
  const paramList = params.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ');
  const description = (tags.description || []).join(' ');
  
  return `  /**
   * ${description}
   */
  ${methodName}(${paramList}): ${returns};`;
}

/**
 * Generate TypeScript constant declaration
 */
function generateConstantDeclaration(tags, codeLine) {
  const constName = extractConstantName(codeLine);
  if (!constName) return null;
  
  const description = (tags.description || []).join(' ');
  
  return `  /**
   * ${description}
   */
  static readonly ${constName}: number;`;
}

/**
 * Parse parameter string from JSDoc
 */
function parseParam(paramStr) {
  const match = paramStr.match(/\{([^}]+)\}\s+(\[?)([\w.]+)(\]?)\s*-?\s*(.*)/);
  if (!match) return { name: 'unknown', type: 'any', optional: false, description: '' };
  
  const [, type, optStart, name, optEnd, description] = match;
  const optional = !!(optStart || optEnd);
  
  return {
    name: name.replace(/[\[\]]/g, ''),
    type: convertJSDocTypeToTS(type),
    optional,
    description: description || ''
  };
}

/**
 * Parse property string from JSDoc
 */
function parseProperty(propStr) {
  const match = propStr.match(/\{([^}]+)\}\s+(\[?)([\w.]+)(\]?)\s*-?\s*(.*)/);
  if (!match) return { name: 'unknown', type: 'any', optional: false, description: '' };
  
  const [, type, optStart, name, optEnd, description] = match;
  const optional = !!(optStart || optEnd);
  
  return {
    name: name.replace(/[\[\]]/g, ''),
    type: convertJSDocTypeToTS(type),
    optional,
    description: description || ''
  };
}

/**
 * Parse return type from JSDoc
 */
function parseReturn(returnStr) {
  const match = returnStr.match(/\{([^}]+)\}/);
  return match ? convertJSDocTypeToTS(match[1]) : 'void';
}

/**
 * Convert JSDoc types to TypeScript types
 */
function convertJSDocTypeToTS(jsdocType) {
  const typeMap = {
    'object': 'object',
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'function': 'Function',
    'Function': 'Function',
    'array': 'any[]',
    'Array': 'any[]',
    'undefined': 'undefined',
    'null': 'null',
    'void': 'void'
  };
  
  // Handle arrays
  if (jsdocType.includes('Array<') || jsdocType.includes('[]')) {
    return jsdocType.replace(/Array<([^>]+)>/g, '$1[]');
  }
  
  // Handle union types
  if (jsdocType.includes('|')) {
    return jsdocType.split('|').map(t => t.trim()).map(convertJSDocTypeToTS).join(' | ');
  }
  
  return typeMap[jsdocType] || jsdocType;
}

/**
 * Extract method name from code line
 */
function extractMethodName(codeLine) {
  // Handle prototype methods
  const prototypeMatch = codeLine.match(/AirConsole\.prototype\.(\w+)/);
  if (prototypeMatch) return prototypeMatch[1];
  
  // Handle regular functions
  const functionMatch = codeLine.match(/function\s+(\w+)/);
  if (functionMatch) return functionMatch[1];
  
  return null;
}

/**
 * Extract constant name from code line
 */
function extractConstantName(codeLine) {
  const match = codeLine.match(/AirConsole\.(\w+)\s*[=:]/);
  return match ? match[1] : null;
}

/**
 * Generate TypeScript file header
 */
function generateHeader() {
  return `// TypeScript definitions for AirConsole API
// Generated automatically from JSDoc comments
// Definitions: https://github.com/dreamora/airconsole-api

declare global {
  /**
   * The AirConsole API for building games on the AirConsole platform
   */
  var AirConsole: AirConsoleConstructor;
}

export = AirConsole;
export as namespace AirConsole;

`;
}

/**
 * Generate TypeScript file footer
 */
function generateFooter() {
  return `
/**
 * The main AirConsole object interface
 */
interface AirConsoleObject {
  // Methods will be populated by the parser
}

declare namespace AirConsole {
  // Type definitions will be populated by the parser
}
`;
}

/**
 * Post-process the generated declarations for better TypeScript support
 */
function postProcessDeclarations(content) {
  return content;
}

/**
 * Create tsd-jsdoc configuration (not used in current implementation)
 */
function createTsdJsdocConfig() {
  // This function is kept for compatibility but not used
  // since we're using manual parsing instead of tsd-jsdoc
}

/**
 * Main function
 */
function main() {
  try {
    console.log('Starting TypeScript declaration generation...');
    
    // Find the latest AirConsole file
    const latestFile = findLatestAirConsoleFile();
    console.log(`Found latest AirConsole file: ${latestFile.path}`);
    
    // Extract version
    const version = extractVersion(latestFile.path);
    if (!version) {
      throw new Error(`Could not extract version from ${latestFile.path}`);
    }
    console.log(`Detected version: ${version}`);
    
    // Update package.json
    updatePackageVersion(version);
    
    // Generate TypeScript declarations
    generateTypeScriptDeclarations(latestFile.path, './index.d.ts');
    
    console.log('TypeScript declaration generation completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  findLatestAirConsoleFile,
  extractVersion,
  updatePackageVersion,
  generateTypeScriptDeclarations
};