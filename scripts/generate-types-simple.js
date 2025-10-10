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
      const dir = pattern.includes('./beta/') ? './beta' : pattern.includes('./deprecated/') ? './deprecated' : '.';
      const files = fs.readdirSync(dir)
        .filter(f => f.match(/^airconsole-\d+\.\d+\.\d+\.js$/))
        .map(f => path.join(dir, f));
      
      allFiles = allFiles.concat(files.map(file => ({
        path: file,
        priority: pattern.includes('./airconsole-') ? 0 : pattern.includes('./beta/') ? 1 : 2
      })));
    } catch (e) {
      // Ignore if directory doesn't exist
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
 * Generate TypeScript declarations
 */
function generateTypeScriptDeclarations(sourceFile, outputFile) {
  console.log(`Generating TypeScript declarations from ${sourceFile}...`);
  
  try {
    const content = fs.readFileSync(sourceFile, 'utf8');
    const version = extractVersion(sourceFile);
    const declarations = generateBasicDeclarations(content, version);
    
    // Write to index.d.ts
    fs.writeFileSync(outputFile, declarations);
    
    console.log(`Generated ${outputFile}`);
  } catch (error) {
    console.error('Error generating TypeScript declarations:', error.message);
    throw error;
  }
}

/**
 * Generate basic TypeScript declarations with comprehensive coverage
 */
function generateBasicDeclarations(content, version) {
  return `// TypeScript definitions for AirConsole API v${version}
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

/**
 * AirConsole constructor interface
 */
interface AirConsoleConstructor {
  new (opts?: AirConsole.Config): AirConsoleObject;
  
  // Constants
  SCREEN: number;
  ORIENTATION_PORTRAIT: string;
  ORIENTATION_LANDSCAPE: string;
  
  // Other constants will be extracted automatically
  [key: string]: any;
}

/**
 * Main AirConsole object interface
 */
interface AirConsoleObject {
  // Core methods
  onReady(code: string): void;
  onConnect(device_id: number): void;
  onDisconnect(device_id: number): void;
  onMessage(device_id: number, data: any): void;
  onDeviceStateChange(device_id: number, user_data: object): void;
  onCustomDeviceStateChange(device_id: number, custom_data: object): void;
  onDeviceProfileChange(device_id: number): void;
  onActivePlayersChange(players: number[]): void;
  onPremium(device_id: number): void;
  onAdShow(): void;
  onAdComplete(ad_was_shown: boolean): void;
  onPause(): void;
  onResume(): void;
  onTooManyPlayers(): void;
  onDeviceMotion(device_id: number, data: AirConsole.DeviceMotion): void;
  onHighScore(high_scores: AirConsole.HighScore[]): void;
  onHighScoreStored(high_score: AirConsole.HighScore | null): void;
  onPersistentDataStored(uid: string): void;
  onPersistentDataLoaded(data: object): void;
  onEmailAddress(email: string | null): void;
  
  // Messaging
  message(device_id: number, data: any): void;
  broadcast(data: any): void;
  
  // Device management
  getDeviceId(): number;
  getServerTime(): number;
  getNickname(device_id?: number): string;
  getProfilePicture(device_id?: number, size?: number): string;
  getUID(device_id?: number): string | undefined;
  convertPlayerNumberToDeviceId(player_number: number): number | undefined;
  convertDeviceIdToPlayerNumber(device_id: number): number | undefined;
  isUserLoggedIn(device_id?: number): boolean | undefined;
  isPremium(device_id?: number): boolean | undefined;
  getDeviceIds(): number[];
  isController(device_id?: number): boolean;
  getMasterControllerDeviceId(): number;
  getActivePlayerDeviceIds(): number[];
  getMaxPlayers(): number;
  requestEmailAddress(): void;
  
  // Device states
  setCustomDeviceState(data: object): void;
  setCustomDeviceStateProperty(key: string, value: any): void;
  getCustomDeviceState(device_id?: number): object | undefined;
  
  // Active players
  setActivePlayers(max_players?: number): void;
  
  // Ads
  showAd(): void;
  
  // Navigation
  navigateHome(): void;
  navigateTo(url: string): void;
  openExternalUrl(url: string): void;
  
  // UI
  setOrientation(orientation: string): void;
  
  // Persistent data
  requestPersistentData(uids: string[]): void;
  storePersistentData(key: string, value: any, uid?: string): void;
  
  // High scores
  requestHighScores(level_name: string, level_version: string, uids?: string[], ranks?: string[], total?: number, top?: number): void;
  storeHighScore(level_name: string, level_version: string, score: number, uid?: string, data?: string, score_string?: string): void;
  
  // Device motion
  startVibration(time: number, device_id?: number): void;
  
  // Immersive
  setImmersiveState(immersive: boolean): void;
  
  // Player silencing
  arePlayersSilenced(): boolean;
}

declare namespace AirConsole {
  /**
   * Configuration options for AirConsole constructor
   */
  interface Config {
    orientation?: string;
    synchronize_time?: boolean;
    setup_document?: boolean;
    device_motion?: number;
    translation?: boolean;
    silence_inactive_players?: boolean;
  }
  
  /**
   * Device information
   */
  interface Device {
    uid?: string;
    nickname?: string;
    slow_connection?: boolean;
    custom?: object;
    premium?: boolean;
    auth?: boolean;
    location?: object;
  }
  
  /**
   * Device motion data
   */
  interface DeviceMotion {
    alpha?: number;
    beta?: number;
    gamma?: number;
    x?: number;
    y?: number;
    z?: number;
  }
  
  /**
   * High score entry
   */
  interface HighScore {
    score: number;
    score_string: string;
    level_name: string;
    level_version: string;
    uid: string;
    nickname: string;
    data: string;
    profile_pic: string;
    timestamp: number;
    rank: number;
  }
}
`;
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