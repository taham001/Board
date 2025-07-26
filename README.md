# 🧑‍🎨 Real-Time Collaborative Whiteboard

A real-time collaborative whiteboard app that lets multiple users draw shapes together in shared rooms, with live synchronization and persistent board history. Built with **Express**, **Socket.IO**, **MongoDB**, and **Vanilla JavaScript + SVG**.

---

## ✨ Features

- 🔷 **Shape Drawing:** Draw lines, rectangles, and other SVG-based shapes.
- 🖊️ **Freehand Drawing :** Support for pen-like tools.
- 🧑‍🤝‍🧑 **Multi-User Collaboration:** Multiple users can draw simultaneously.
- 🪪 **Room-Based System:** Create and join rooms with a unique ID.
- 💾 **Persistent Boards:** Drawings persist in the database per room.
- 🧼 **Clear Board:** Erase the entire board content with a click.
- 🗑 **Room Deletion:** Option to delete a room and its drawings permanently.
- ⚡ **Real-Time Sync:** Built using WebSockets (Socket.IO).
- 🌐 **Minimal & Fast Frontend:** SVG-based canvas with intuitive tools.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/whiteboard-app.git
cd whiteboard-app

```
### 2. Create a .env file with content as follows:
```
PORT=3000 
mongoDbURL=mongodb://localhost:27017/whiteboard
```
### 3. Installing dependencies
```
cd server
npm install
```

### 4. Running the server
 ```
node server.js
```
### 5. Visit:
http://localhost:3000


