# DraftMPL V2.0

DraftMPL is a web-based project related to Mobile Legends: Bang Bang (MLBB) hero drafting.

## Overview

This repository contains the client and server components of DraftMPL, along with a JavaScript data file that defines hero information and associated media assets.

The project uses Node.js, Express, and Socket.IO as part of its server-side dependencies.

## Tech Stack

- **Runtime:** Node.js
- **Backend:** Express.js 5
- **Real-time communication:** Socket.IO 4
- **Language:** JavaScript

## Project Structure

```text
DraftMPL/
├── client/           # Client-side application
├── server/           # Server-side application
├── heroList.js       # Hero data and media references
├── package.json      # Project dependencies
├── package-lock.json # Dependency lock file
└── README.md
```

## Assets

Media assets used by the project are stored separately on Google Drive.

**Asset repository:** [DraftMPL Assets](https://drive.google.com/drive/folders/1rRZyl51ceu9jc5hnpdaQqO_P8Pqp2hw1?usp=sharing)

The `heroList.js` file contains references to hero images, videos, and voice-over files. Make sure the required assets are available in the locations expected by the application.

## Getting Started

### Prerequisites

Install the following software before setting up the project:

- [Node.js](https://nodejs.org/)
- npm, which is included with Node.js

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/dimsyyy/DraftMPL.git
   ```

2. Navigate to the project directory:

   ```bash
   cd DraftMPL
   ```

3. Install the project dependencies:

   ```bash
   npm install
   ```

4. Download the required assets from the Google Drive folder and arrange them according to the paths expected by the application.

### Running the Application

The exact startup commands depend on the entry point and configuration defined in the `server/` and `client/` directories.

Check the relevant project files for the correct commands before starting the application.

## Hero Data

The `heroList.js` file defines hero records with the following fields:

| Field | Description |
|---|---|
| `name` | Hero name |
| `imageFile` | Hero image filename |
| `videoFile` | Hero video filename |
| `voiceoverFile` | Hero voice-over filename |
| `stats.picks` | Recorded pick statistic |
| `stats.winrate` | Recorded win-rate statistic |

These records can be used by the application to associate hero information with its corresponding media files.
