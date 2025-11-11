# WebOS Terminal Guide

WebOS includes three authentic retro terminals, each with its own unique flavor and capabilities.

## Accessing Terminals

You can access terminals in three ways:

1. **Desktop Icons** - Double-click the terminal icons on the desktop (Linux, C64, DOS)
2. **Tools Menu** - Select from Workbench menu: Tools → [Terminal Name]
3. **Execute Command** - Use Workbench → Execute Command and select "Shell" for AmigaShell

## Linux Terminal

The Linux Terminal provides a full-featured bash-like command line with green text on a black background.

### File System Commands

- `ls [options]` - List directory contents
  - `-a` - Show all files including hidden
  - `-l` - Long format with details
  - `-la` - Combination of both
- `cd <directory>` - Change directory
  - `cd ~` - Go to home directory
  - `cd ..` - Go up one level
- `pwd` - Print working directory
- `cat <file>` - Display file contents
- `mkdir <directory>` - Create directory
- `rm <file>` - Remove file or directory
  - `-r` - Recursive delete
  - `-rf` - Force recursive delete
- `touch <file>` - Create empty file
- `cp <source> <dest>` - Copy file
- `mv <source> <dest>` - Move or rename file
- `find <pattern>` - Find files matching pattern

### Text Processing

- `head <file>` - Show first 10 lines
  - `-n <count>` - Show first N lines
- `tail <file>` - Show last 10 lines
  - `-n <count>` - Show last N lines
- `wc <file>` - Count lines, words, and characters
- `grep <pattern>` - Search for text (use with pipes)
- `sort` - Sort lines (use with pipes)
- `uniq` - Remove duplicate lines (use with pipes)

### System Information

- `whoami` - Display current user
- `uname` - System information
  - `-a` - All information
- `date` - Show current date and time
- `ps` - Display running processes
- `top` - System monitor
- `df` - Disk space usage
- `free` - Memory usage
- `kill <pid>` - Kill process by PID

### Environment & Customization

- `env` - Show environment variables
- `export VAR=value` - Set environment variable
- `alias name=command` - Create command alias
  - `alias` - Show all aliases
  - Built-in aliases: `ll` (ls -la), `la` (ls -a)
- `which <command>` - Show command location
- `history` - Show command history

### Utilities

- `echo <text>` - Display text
- `man <command>` - Display manual page
- `clear` - Clear screen
- `help` - Show all commands

### Pipe Support

Chain commands together using the pipe operator (`|`):

```bash
cat file.txt | grep search | sort
ls -la | grep .txt | wc
cat data.txt | head -n 20 | tail -n 10
```

Supported pipe commands: `grep`, `sort`, `uniq`, `head`, `tail`, `wc`

### Examples

```bash
# Find all files containing "test"
ls | grep test

# Show first 20 lines of a file
head -n 20 myfile.txt

# Count how many .txt files exist
ls | grep .txt | wc

# Create an alias
alias ll=ls -la

# Set environment variable
export PATH=/usr/bin:/bin

# Copy and rename files
cp original.txt backup.txt
mv old.txt new.txt
```

## C64 Terminal (Commodore 64 BASIC)

The C64 Terminal is a full Commodore 64 BASIC V2 interpreter with authentic blue background and light blue text.

### Direct Mode Commands

- `LIST [line]` - List program (or specific line)
- `RUN` - Run the current program
- `NEW` - Clear program from memory
- `LOAD "filename"` - Load program from disk
- `SAVE "filename"` - Save program to disk
- `DIR` / `CATALOG` - Show disk directory
- `CLS` / `CLR` - Clear screen
- `HELP` - Show command reference

### Immediate Execution

- `PRINT <expression>` - Print value
  - `? <expression>` - Shorthand for PRINT
- `LET VAR=value` - Set variable
  - `A=10` - LET is optional
- `POKE addr,value` - Poke memory
- `PEEK(addr)` - Peek memory
- `SYS <addr>` - System call

### Programming Commands

- `LET variable=value` - Assign variable
  - Numeric variables: `A`, `B`, `X`, etc.
  - String variables: `A$`, `NAME$`, etc.
- `PRINT <expression>` - Print output
- `IF condition THEN statement` - Conditional execution
- `FOR variable=start TO end [STEP increment]` - Loop
- `NEXT [variable]` - End of FOR loop
- `GOTO line` - Jump to line number
- `GOSUB line` - Call subroutine
- `RETURN` - Return from subroutine
- `REM comment` - Comment line
- `END` / `STOP` - End program

### Variables & Expressions

- Variables: Single letter (A-Z) or letter + digit (A0-Z9)
- String variables: Variable name followed by $ (A$, NAME$)
- Operators: `+`, `-`, `*`, `/`, `=`, `<>`, `<`, `>`, `<=`, `>=`

### Example Programs

**Simple Counter:**
```basic
10 LET A=1
20 PRINT A
30 LET A=A+1
40 IF A<=10 THEN GOTO 20
50 END
```

**FOR Loop:**
```basic
10 FOR I=1 TO 10
20 PRINT "NUMBER "; I
30 NEXT I
40 END
```

**Subroutine:**
```basic
10 GOSUB 1000
20 PRINT "BACK FROM SUBROUTINE"
30 END
1000 REM SUBROUTINE
1010 PRINT "IN SUBROUTINE"
1020 RETURN
```

**Variables and Conditions:**
```basic
10 LET A=5
20 LET B=10
30 IF A<B THEN PRINT "A IS SMALLER"
40 IF A>B THEN PRINT "A IS BIGGER"
50 END
```

### Special Commands

- `SYS 64738` - Reset (clears screen)

## DOS Terminal (MS-DOS)

The DOS Terminal provides an authentic MS-DOS 6.22 experience with white text on black background.

### File System Commands

- `DIR [/W] [/P]` - Directory listing
  - `/W` - Wide format (5 columns)
  - `/P` - Pause after each screen
- `CD <directory>` / `CHDIR` - Change directory
  - `CD ..` - Parent directory
  - `CD \` - Root directory
- `MD <directory>` / `MKDIR` - Make directory
- `RD <directory>` / `RMDIR` - Remove directory
- `DEL <file>` / `ERASE` - Delete file
- `TYPE <file>` - Display file contents
- `COPY <source> <dest>` - Copy file
- `MOVE <source> <dest>` - Move file
- `REN <old> <new>` / `RENAME` - Rename file

### System Commands

- `DATE` - Display/set date
- `TIME` - Display/set time
- `VER` - Show DOS version
- `VOL` - Show volume label
- `PATH` - Display search path
- `SET` - Show environment variables
- `MEM` - Display memory information
- `TREE` - Display directory tree
- `CLS` - Clear screen
- `HELP` / `?` - Show help

### Utilities

- `ECHO <text>` - Display text
  - `ECHO ON/OFF` - Enable/disable command echo
- `ATTRIB` - File attributes (not implemented)
- `EDIT` - Text editor (use NotePad instead)

### Drive Commands

- `C:` - Switch to C: drive
- `D:` - Switch to D: drive

### Examples

```dos
DIR /W
CD WINDOWS
MD NEWDIR
COPY FILE1.TXT FILE2.TXT
TYPE README.TXT
DATE
TIME
MEM
TREE
```

## Keyboard Shortcuts

All terminals support:

- **↑ / ↓** - Navigate command history
- **Tab** - Command auto-completion (Linux only)
- **Ctrl+C** - Cancel current operation (where applicable)

## Tips & Tricks

### Linux Terminal

- Use `alias` to create shortcuts for common commands
- Pipe commands together for powerful text processing
- Use `history` to review and repeat previous commands
- Tab completion works for all built-in commands

### C64 Terminal

- Programs are stored in memory until you type `NEW`
- Use `LIST` to review your program before running
- Save your work frequently with `SAVE "filename"`
- String variables must end with `$`
- Line numbers should increment by 10 for easy editing

### DOS Terminal

- Use `/W` with `DIR` for easier reading
- DOS paths use backslash (`\`) not forward slash (`/`)
- Commands are case-insensitive
- Use `HELP` to see all available commands

## File System Integration

All terminals interact with the same WebOS file system:

- Linux paths: `/home/user` maps to `dh0`
- C64 paths: Disk operations use `dh0`
- DOS paths: `C:\` maps to `dh0`

Files created in one terminal are accessible from others!

## Troubleshooting

**Command not found:**
- Type `help` to see all available commands
- Check spelling and case (DOS/C64 are case-insensitive, Linux is case-sensitive)

**File not found:**
- Use `ls` (Linux), `DIR` (DOS), or `DIR` (C64) to list files
- Verify you're in the correct directory with `pwd` (Linux) or `CD` (DOS)

**Program won't run (C64):**
- Verify program syntax with `LIST`
- Check for matching FOR/NEXT, GOSUB/RETURN pairs
- Ensure line numbers are in sequence

## Advanced Features

### Linux: Creating Complex Pipelines

```bash
# Find and count specific files
ls -la | grep .txt | wc

# Show specific lines from a file
cat largefile.txt | head -n 100 | tail -n 20

# Search and sort results
cat data.txt | grep error | sort | uniq
```

### C64: Advanced Programming

```basic
10 REM Advanced program with subroutines
20 LET X=0
30 FOR I=1 TO 5
40 LET X=X+I
50 GOSUB 1000
60 NEXT I
70 END
1000 REM Print routine
1010 PRINT "VALUE: "; X
1020 RETURN
```

### DOS: Batch Operations

While full `.BAT` file support is not implemented, you can execute multiple commands sequentially by reopening the terminal for each command.

## Version Information

- Linux Terminal: WebOS Linux Shell v1.0
- C64 Terminal: Commodore 64 BASIC V2 (Enhanced)
- DOS Terminal: MS-DOS 6.22 Emulation Layer

For more information, visit the WebOS project documentation.
