# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2025-06-09

### Changed

- Revised README documentation to match the latest implementation  
  Updated explanation in "How it works" section to reflect the new event-driven dependency callback system.

## [1.1.0] - 2025-06-09

### Changed

- Replaced polling-based dependency checks with an event-driven callback system  
  This improves performance and responsiveness by allowing builds to immediately react to dependency changes instead of
  waiting for periodic checks.

## [1.0.0] - 2025-06-07

Initial release

[Unreleased]: https://github.com/jhae-de/tsup-sequential-build-plugin/compare/v1.1.0...main
[1.1.0]: https://github.com/jhae-de/tsup-sequential-build-plugin/releases/tag/v1.1.0
[1.0.0]: https://github.com/jhae-de/tsup-sequential-build-plugin/releases/tag/v1.0.0
