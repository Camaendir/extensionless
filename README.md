# Extensionless

A small obsidian plugin that overwrites the default obsidian link resolver to allow for links to files without file extensions.
It first runs the original resolver, so it will match markdown files first, if they exist, and then link to the extensionless file.
Just install it and the links will work.
Tested on MacOS and Linux.

## ToDos

- [x] Proper settings
  - global enable/disable
  - markdown first / markdown last
