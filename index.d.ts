// TypeScript definitions for AirConsole API v1.9.0
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
