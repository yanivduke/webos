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

// Classic Amiga Games (Workbench 3.1 and 1.3)
const amigaGames: Game[] = [
  {
    id: 'amiga-pong',
    name: 'Pong',
    description: 'Classic Pong game',
    icon: '🏓',
    type: 'javascript',
    component: 'PongGame',
    osTheme: ['classic-amiga', 'workbench-13']
  },
  {
    id: 'amiga-breakout',
    name: 'Breakout',
    description: 'Classic brick breaker game',
    icon: '🧱',
    type: 'javascript',
    component: 'BreakoutGame',
    osTheme: ['classic-amiga', 'workbench-13']
  },
  {
    id: 'amiga-snake',
    name: 'Snake',
    description: 'Classic snake game',
    icon: '🐍',
    type: 'javascript',
    component: 'SnakeGame',
    osTheme: ['classic-amiga', 'workbench-13']
  },
  {
    id: 'amiga-tetris',
    name: 'Tetris',
    description: 'Classic block puzzle game',
    icon: '🟦',
    type: 'javascript',
    component: 'TetrisGame',
    osTheme: ['classic-amiga', 'workbench-13']
  },
  {
    id: 'amiga-asteroids',
    name: 'Asteroids',
    description: 'Classic space shooter',
    icon: '🚀',
    type: 'javascript',
    component: 'AsteroidsGame',
    osTheme: ['classic-amiga', 'workbench-13']
  },
  {
    id: 'amiga-space-invaders',
    name: 'Space Invaders',
    description: 'Classic arcade shooter',
    icon: '👾',
    type: 'javascript',
    component: 'SpaceInvadersGame',
    osTheme: ['classic-amiga', 'workbench-13']
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
    osTheme: ['commodore-64']
  },
  {
    id: 'c64-snake',
    name: 'C64 Snake',
    description: 'Snake on Commodore 64',
    icon: '🐍',
    type: 'javascript',
    component: 'SnakeGame',
    osTheme: ['commodore-64']
  },
  {
    id: 'c64-space-invaders',
    name: 'Space Invaders',
    description: 'Classic arcade shooter',
    icon: '👾',
    type: 'javascript',
    component: 'SpaceInvadersGame',
    osTheme: ['commodore-64']
  },
  {
    id: 'c64-breakout',
    name: 'C64 Breakout',
    description: 'Breakout on Commodore 64',
    icon: '🧱',
    type: 'javascript',
    component: 'BreakoutGame',
    osTheme: ['commodore-64']
  },
  {
    id: 'c64-tetris',
    name: 'C64 Tetris',
    description: 'Tetris on Commodore 64',
    icon: '🟦',
    type: 'javascript',
    component: 'TetrisGame',
    osTheme: ['commodore-64']
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
    osTheme: ['dos-classic']
  },
  {
    id: 'dos-snake',
    name: 'DOS Snake',
    description: 'Snake for MS-DOS',
    icon: '🐍',
    type: 'javascript',
    component: 'SnakeGame',
    osTheme: ['dos-classic']
  },
  {
    id: 'dos-sokoban',
    name: 'Sokoban',
    description: 'Classic puzzle game',
    icon: '📦',
    type: 'javascript',
    component: 'SokobanGame',
    osTheme: ['dos-classic']
  },
  {
    id: 'dos-tetris',
    name: 'DOS Tetris',
    description: 'Tetris for MS-DOS',
    icon: '🟦',
    type: 'javascript',
    component: 'TetrisGame',
    osTheme: ['dos-classic']
  },
  {
    id: 'dos-minesweeper',
    name: 'Minesweeper',
    description: 'Classic mine finder',
    icon: '💣',
    type: 'javascript',
    component: 'MinesweeperGame',
    osTheme: ['dos-classic']
  }
];

// Atari ST Games
const atariGames: Game[] = [
  {
    id: 'atari-pong',
    name: 'ST Pong',
    description: 'Pong on Atari ST',
    icon: '🏓',
    type: 'javascript',
    component: 'PongGame',
    osTheme: ['atari-st']
  },
  {
    id: 'atari-breakout',
    name: 'ST Breakout',
    description: 'Breakout on Atari ST',
    icon: '🧱',
    type: 'javascript',
    component: 'BreakoutGame',
    osTheme: ['atari-st']
  },
  {
    id: 'atari-asteroids',
    name: 'ST Asteroids',
    description: 'Asteroids on Atari ST',
    icon: '🚀',
    type: 'javascript',
    component: 'AsteroidsGame',
    osTheme: ['atari-st']
  },
  {
    id: 'atari-tetris',
    name: 'ST Tetris',
    description: 'Tetris on Atari ST',
    icon: '🟦',
    type: 'javascript',
    component: 'TetrisGame',
    osTheme: ['atari-st']
  },
  {
    id: 'atari-snake',
    name: 'ST Snake',
    description: 'Snake on Atari ST',
    icon: '🐍',
    type: 'javascript',
    component: 'SnakeGame',
    osTheme: ['atari-st']
  }
];

// Apple II Games
const appleIIGames: Game[] = [
  {
    id: 'apple2-snake',
    name: 'Apple Snake',
    description: 'Snake on Apple II',
    icon: '🐍',
    type: 'javascript',
    component: 'SnakeGame',
    osTheme: ['apple-ii']
  },
  {
    id: 'apple2-breakout',
    name: 'Apple Breakout',
    description: 'Breakout on Apple II',
    icon: '🧱',
    type: 'javascript',
    component: 'BreakoutGame',
    osTheme: ['apple-ii']
  },
  {
    id: 'apple2-pong',
    name: 'Apple Pong',
    description: 'Pong on Apple II',
    icon: '🏓',
    type: 'javascript',
    component: 'PongGame',
    osTheme: ['apple-ii']
  },
  {
    id: 'apple2-asteroids',
    name: 'Apple Asteroids',
    description: 'Asteroids on Apple II',
    icon: '🚀',
    type: 'javascript',
    component: 'AsteroidsGame',
    osTheme: ['apple-ii']
  }
];

// Mac Games (System 1 and Classic)
const macGames: Game[] = [
  {
    id: 'mac-pong',
    name: 'Mac Pong',
    description: 'Pong on Macintosh',
    icon: '🏓',
    type: 'javascript',
    component: 'PongGame',
    osTheme: ['mac-system1', 'mac-classic']
  },
  {
    id: 'mac-breakout',
    name: 'Mac Breakout',
    description: 'Breakout on Macintosh',
    icon: '🧱',
    type: 'javascript',
    component: 'BreakoutGame',
    osTheme: ['mac-system1', 'mac-classic']
  },
  {
    id: 'mac-tetris',
    name: 'Mac Tetris',
    description: 'Tetris on Macintosh',
    icon: '🟦',
    type: 'javascript',
    component: 'TetrisGame',
    osTheme: ['mac-system1', 'mac-classic']
  },
  {
    id: 'mac-snake',
    name: 'Mac Snake',
    description: 'Snake on Macintosh',
    icon: '🐍',
    type: 'javascript',
    component: 'SnakeGame',
    osTheme: ['mac-system1', 'mac-classic']
  },
  {
    id: 'mac-minesweeper',
    name: 'Mac Minesweeper',
    description: 'Minesweeper on Macintosh',
    icon: '💣',
    type: 'javascript',
    component: 'MinesweeperGame',
    osTheme: ['mac-system1', 'mac-classic']
  }
];

// Windows 3.1 Games
const windowsGames: Game[] = [
  {
    id: 'win31-minesweeper',
    name: 'Minesweeper',
    description: 'Classic Windows Minesweeper',
    icon: '💣',
    type: 'javascript',
    component: 'MinesweeperGame',
    osTheme: ['windows-31']
  },
  {
    id: 'win31-tetris',
    name: 'Win Tetris',
    description: 'Tetris for Windows',
    icon: '🟦',
    type: 'javascript',
    component: 'TetrisGame',
    osTheme: ['windows-31']
  },
  {
    id: 'win31-snake',
    name: 'Win Snake',
    description: 'Snake for Windows',
    icon: '🐍',
    type: 'javascript',
    component: 'SnakeGame',
    osTheme: ['windows-31']
  },
  {
    id: 'win31-breakout',
    name: 'Win Breakout',
    description: 'Breakout for Windows',
    icon: '🧱',
    type: 'javascript',
    component: 'BreakoutGame',
    osTheme: ['windows-31']
  },
  {
    id: 'win31-sokoban',
    name: 'Win Sokoban',
    description: 'Sokoban for Windows',
    icon: '📦',
    type: 'javascript',
    component: 'SokobanGame',
    osTheme: ['windows-31']
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
    osTheme: ['linux', 'dark-mode']
  },
  {
    id: 'linux-minesweeper',
    name: 'Minesweeper',
    description: 'Classic mine finder',
    icon: '💣',
    type: 'javascript',
    component: 'MinesweeperGame',
    osTheme: ['linux', 'dark-mode']
  },
  {
    id: 'linux-snake',
    name: 'Terminal Snake',
    description: 'Snake in terminal style',
    icon: '🐍',
    type: 'javascript',
    component: 'SnakeGame',
    osTheme: ['linux', 'dark-mode']
  },
  {
    id: 'linux-tetris',
    name: 'Terminal Tetris',
    description: 'Tetris in terminal style',
    icon: '🟦',
    type: 'javascript',
    component: 'TetrisGame',
    osTheme: ['linux', 'dark-mode']
  }
];

// All games combined
export const allGames: Game[] = [
  ...amigaGames,
  ...c64Games,
  ...dosGames,
  ...atariGames,
  ...appleIIGames,
  ...macGames,
  ...windowsGames,
  ...linuxGames
];

/**
 * Get games for a specific theme
 */
export function getGamesForTheme(themeId: string): Game[] {
  // Direct theme to games mapping
  const directThemes = [
    'classic-amiga', 'workbench-13',
    'commodore-64',
    'dos-classic',
    'atari-st',
    'apple-ii',
    'mac-system1', 'mac-classic',
    'windows-31',
    'linux', 'dark-mode'
  ];

  // If the theme has direct games, use those
  if (directThemes.includes(themeId)) {
    return allGames.filter(game => game.osTheme.includes(themeId));
  }

  // Fallback mappings for themes without specific games
  const themeMapping: { [key: string]: string } = {
    'high-contrast': 'classic-amiga',
    'modern': 'dark-mode'
  };

  const mappedTheme = themeMapping[themeId] || 'classic-amiga';
  return allGames.filter(game => game.osTheme.includes(mappedTheme));
}

/**
 * Get games for current terminal type
 */
export function getGamesForTerminal(terminalType: 'amiga' | 'c64' | 'dos' | 'linux' | 'mac' | 'atari' | 'apple2' | 'windows'): Game[] {
  const themeMap: { [key: string]: string } = {
    'amiga': 'classic-amiga',
    'c64': 'commodore-64',
    'dos': 'dos-classic',
    'linux': 'linux',
    'mac': 'mac-classic',
    'atari': 'atari-st',
    'apple2': 'apple-ii',
    'windows': 'windows-31'
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

/**
 * Get all available OS themes with games
 */
export function getAvailableOSThemes(): string[] {
  return [
    'classic-amiga',
    'workbench-13',
    'commodore-64',
    'dos-classic',
    'atari-st',
    'apple-ii',
    'mac-system1',
    'mac-classic',
    'windows-31',
    'linux',
    'dark-mode'
  ];
}

export default {
  allGames,
  getGamesForTheme,
  getGamesForTerminal,
  getGameById,
  getAvailableOSThemes
};
