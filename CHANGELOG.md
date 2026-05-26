# Changelog

All notable changes to this project are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
aims to use [Semantic Versioning](https://semver.org/spec/v2.0.0.html) once
a first tagged release is cut.

## [Unreleased]

### Added
- Initial repo scaffolding: TypeScript sources under `src/`, vitest tests
  under `test/`, tsup config emitting dual ESM/CJS plus declarations to
  `dist/`.
- GitHub Actions CI (`.github/workflows/ci.yml`) running typecheck, test,
  and build on a matrix of Node 20 and 22, with third-party actions
  SHA-pinned.
- npm publish workflow (`.github/workflows/publish.yml`) gated on a
  GitHub release event; will not fire until a release is cut.
- Dependabot configuration (`.github/dependabot.yml`) covering npm and
  GitHub Actions.
- `parse` and `stringify` placeholder exports that throw "not yet
  implemented" so downstream consumers can pin against the public surface
  before the reader/writer land in §3.2.
