/**
 * Games Configuration
 * Maps OS themes to appropriate retro games
 */

export interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'javascript' | 'emulator' | 'iframe';
  url?: string; // For iframe-based games
  component?: string; // For custom components
  osTheme: string[]; // Which OS themes this game appears in
}

export interface GameCategory {
  id: string;
  name: string;
  games: Game[];
}

// Classic Amiga Games
const amigaGames: Game[] = [
  {
    id: 'amiga-pong',
    name: 'Pong',
    description: 'Classic Pong game',
    icon: '🏓',
    type: 'javascript',
    component: 'PongGame',
    osTheme: ['workbench-31', 'workbench-20']
  },
  {
    id: 'amiga-breakout',
    name: 'Breakout',
    description: 'Classic brick breaker game',
    icon: '🧱',
    type: 'javascript',
    component: 'BreakoutGame',
    osTheme: ['workbench-31', 'workbench-20']
  },
  {
    id: 'amiga-snake',
    name: 'Snake',
    description: 'Classic snake game',
    icon: '🐍',
    type: 'javascript',
    component: 'SnakeGame',
    osTheme: ['workbench-31', 'workbench-20']
  },
  {
    id: 'amiga-tetris',
    name: 'Tetris',
    description: 'Classic block puzzle game',
    icon: '🟦',
    type: 'javascript',
    component: 'TetrisGame',
    osTheme: ['workbench-31', 'workbench-20']
  },
  {
    id: 'amiga-asteroids',
    name: 'Asteroids',
    description: 'Classic space shooter',
    icon: '🚀',
    type: 'javascript',
    component: 'AsteroidsGame',
    osTheme: ['workbench-31', 'workbench-20']
  }
];

// Commodore 64 Games
const c64Games: Game[] = [
  {
    id: 'c64-pong',
    name: 'C64 Pong',
    description: 'Pong on Commodore 64',
    icon: '🏓',
    type: 'javascript',
    component: 'PongGame',
    osTheme: ['c64']
  },
  {
    id: 'c64-snake',
    name: 'C64 Snake',
    description: 'Snake on Commodore 64',
    icon: '🐍',
    type: 'javascript',
    component: 'SnakeGame',
    osTheme: ['c64']
  },
  {
    id: 'c64-space-invaders',
    name: 'Space Invaders',
    description: 'Classic arcade shooter',
    icon: '👾',
    type: 'javascript',
    component: 'SpaceInvadersGame',
    osTheme: ['c64']
  },
  {
    id: 'c64-breakout',
    name: 'C64 Breakout',
    description: 'Breakout on Commodore 64',
    icon: '🧱',
    type: 'javascript',
    component: 'BreakoutGame',
    osTheme: ['c64']
  }
];

// DOS Games
const dosGames: Game[] = [
  {
    id: 'dos-pong',
    name: 'DOS Pong',
    description: 'Pong for MS-DOS',
    icon: '🏓',
    type: 'javascript',
    component: 'PongGame',
    osTheme: ['dos']
  },
  {
    id: 'dos-snake',
    name: 'DOS Snake',
    description: 'Snake for MS-DOS',
    icon: '🐍',
    type: 'javascript',
    component: 'SnakeGame',
    osTheme: ['dos']
  },
  {
    id: 'dos-sokoban',
    name: 'Sokoban',
    description: 'Classic puzzle game',
    icon: '📦',
    type: 'javascript',
    component: 'SokobanGame',
    osTheme: ['dos']
  },
  {
    id: 'dos-tetris',
    name: 'DOS Tetris',
    description: 'Tetris for MS-DOS',
    icon: '🟦',
    type: 'javascript',
    component: 'TetrisGame',
    osTheme: ['dos']
  }
];

// Linux/Unix Games
const linuxGames: Game[] = [
  {
    id: 'linux-2048',
    name: '2048',
    description: 'Number puzzle game',
    icon: '🔢',
    type: 'javascript',
    component: 'Game2048',
    osTheme: ['linux']
  },
  {
    id: 'linux-minesweeper',
    name: 'Minesweeper',
    description: 'Classic mine finder',
    icon: '💣',
    type: 'javascript',
    component: 'MinesweeperGame',
    osTheme: ['linux']
  },
  {
    id: 'linux-snake',
    name: 'Terminal Snake',
    description: 'Snake in terminal style',
    icon: '🐍',
    type: 'javascript',
    component: 'SnakeGame',
    osTheme: ['linux']
  },
  {
    id: 'linux-tetris',
    name: 'Terminal Tetris',
    description: 'Tetris in terminal style',
    icon: '🟦',
    type: 'javascript',
    component: 'TetrisGame',
    osTheme: ['linux']
  }
];

// All games combined
export const allGames: Game[] = [
  ...amigaGames,
  ...c64Games,
  ...dosGames,
  ...linuxGames
];

/**
 * Get games for a specific theme
 */
export function getGamesForTheme(themeId: string): Game[] {
  // Map desktop themes to game themes
  const themeMapping: { [key: string]: string } = {
    'workbench-31': 'workbench-31',
    'workbench-20': 'workbench-20',
    'dark-mode': 'workbench-31', // Default to Amiga for dark mode
    'amber': 'dos', // Amber monitor → DOS era
    'green-screen': 'linux', // Green screen → Unix/Linux era
    'c64': 'c64' // Commodore 64 theme
  };

  const gameTheme = themeMapping[themeId] || 'workbench-31';

  return allGames.filter(game => game.osTheme.includes(gameTheme));
}

/**
 * Get games for current terminal type
 */
export function getGamesForTerminal(terminalType: 'amiga' | 'c64' | 'dos' | 'linux'): Game[] {
  const themeMap: { [key: string]: string } = {
    'amiga': 'workbench-31',
    'c64': 'c64',
    'dos': 'dos',
    'linux': 'linux'
  };

  const theme = themeMap[terminalType];
  return allGames.filter(game => game.osTheme.includes(theme));
}

/**
 * Get game by ID
 */
export function getGameById(gameId: string): Game | undefined {
  return allGames.find(game => game.id === gameId);
}

export default {
  allGames,
  getGamesForTheme,
  getGamesForTerminal,
  getGameById
};
