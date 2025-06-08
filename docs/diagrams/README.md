# Multi-Trip Architecture Diagrams

This directory contains PlantUML diagrams documenting the multi-trip architecture migration from single-trip to multi-trip, per-user system with offline-first capabilities.

## Diagrams

### 1. Database Schema (`database-schema.puml`)

Shows the complete Supabase PostgreSQL database schema including:

- User profiles and authentication
- Multi-trip data structure
- Sync tracking tables
- Relationships and constraints
- Row Level Security (RLS) policies

### 2. Model Architecture (`model-architecture.puml`)

Illustrates the TypeScript model types and Redux store structure including:

- Core domain models (Trip, Person, TripItem, etc.)
- User preferences and settings
- Sync and conflict resolution types
- New Redux store architecture supporting multiple trips

### 3. Sync Flow (`sync-flow.puml`)

Sequence diagram showing the offline-first sync process:

- Optimistic local updates
- Background synchronization
- Conflict detection and resolution
- Online/offline state handling

### 4. IndexedDB Schema (`indexeddb-schema.puml`)

Details the client-side IndexedDB storage schema for offline functionality:

- Object stores and indexes
- Query patterns for efficient data access
- Sync operation workflows

## Viewing the Diagrams

### Online (Recommended)

1. Copy the `.puml` file contents
2. Paste into [PlantUML Online Editor](http://www.plantuml.com/plantuml/uml/)
3. View the rendered diagram

### VS Code Extension

1. Install the "PlantUML" extension by jebbs
2. Open any `.puml` file
3. Use `Ctrl+Shift+P` → "PlantUML: Preview Current Diagram"

### Command Line

If you have PlantUML installed locally:

```bash
# Generate PNG images
plantuml docs/diagrams/*.puml

# Generate SVG images
plantuml -tsvg docs/diagrams/*.puml
```

## Architecture Overview

The diagrams illustrate the transition from a single-trip system to a comprehensive multi-trip architecture that supports:

- **Multi-User Trips**: Each user can create and manage multiple trips
- **Offline-First**: Full functionality without internet connectivity
- **Background Sync**: Automatic synchronization when online
- **Conflict Resolution**: Graceful handling of data conflicts
- **Version Tracking**: Optimistic concurrency control
- **Soft Deletion**: Data preservation with isDeleted flags

## Key Design Principles

1. **Local-First**: All changes happen locally first for immediate responsiveness
2. **Eventual Consistency**: Data synchronizes across devices when online
3. **Conflict Detection**: Version numbers and timestamps detect conflicts
4. **User Control**: Manual resolution for complex conflicts
5. **Data Integrity**: Referential integrity maintained across sync operations

## Implementation Status

These diagrams represent the target architecture for Phase 1 (Database Setup) and Phase 3 (Sync Infrastructure) of the multi-trip migration plan documented in `docs/plans/multi-trip-architecture.md`.
