# Salon Management Kit

An offline-first salon management application designed for small businesses that need a simple, reliable way to handle daily operations without relying on cloud services or constant internet access.

The goal of this project is practicality: software that can actually be used day to day in a real salon environment.

---

## What This Project Solves

Many small salons rely on paper, spreadsheets, or unstable online tools to manage appointments, customers, and sales. This project provides a single, self-contained application that runs locally in the browser and keeps all data on the device. (In this case, The salon relied solely on paper, which can get overstimulating at times.)

No accounts, no servers, no subscriptions.

---

## Key Features

* Customer management with search and history
* Appointment scheduling
* Point-of-sale receipts
* Inventory and stock tracking
* Offline data persistence using IndexedDB
* Arabic (RTL) interface
* Local currency support (AED)

---

## Design Decisions

* **Offline-first**: Built to function without internet access so it can be used reliably in-store.
* **IndexedDB storage**: Chosen to persist structured data locally without requiring a backend.
* **Browser-based**: Runs as a local web app for ease of deployment and portability.
* **TypeScript + React**: Used for maintainability and predictable state management.

---

## Getting Started

### Requirements

* Node.js

### Installation

```bash
npm install
```

### Running the App

```bash
npm run dev
```

For Windows users, a helper script (`start_app.bat`) is included to launch the application easily.

---

## Intended Use

This project is built as a practical tool for small salons or similar businesses that need basic management software without cloud dependencies. It can also serve as a reference for offline-first web application design.

---

## Project Status

This is an actively developed personal project. Features and structure may evolve as real-world use cases are explored.

---

## License

MIT
