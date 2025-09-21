# FreshAlert 🥩✨

**AI-powered food freshness detection for refrigeration enterprises**

FreshAlert automatically detects spoiled food before distribution, reducing waste and optimizing supplier performance through real-time AI analysis.

## 🎯 Problem

Refrigeration companies storing food for months before distribution face:

- **High food waste** from undetected spoilage
- **Manual inspection** inefficiencies
- **No data** on supplier/line performance
- **Quality control** bottlenecks

## 🚀 Solution

- **🤖 AI Detection**: Custom VGG16 model classifies food as fresh/spoiled
- **📊 Real-time Analytics**: Track performance by supplier and production line
- **🔄 Live Monitoring**: Conveyor belt visualization with instant decisions
- **💬 AI Assistant**: Query system data in natural language

## 🔧 Tech Stack

**Backend**: Node.js, PostgreSQL, Socket.IO, TensorFlow Lite  
**Frontend**: React, Three.js, Real-time WebSockets  
**AI**: Custom VGG16 model, Computer Vision pipeline

## 🚀 Quick Start

```bash
# Backend
cd Backend && npm install && npm run dev

# Frontend
cd web && npm install && npm start

# Database
psql -d database -f tables.sql
```

## 💡 Key Features

- **Real-time conveyor belt monitoring** with 3D visualization
- **Automatic fresh/spoiled classification** using AI
- **Performance analytics** per supplier and production line
- **AI chat assistant** for data queries
- **HTTPS/WebSocket** real-time communication

## 📊 Business Impact

- Reduce food waste through early spoilage detection
- Optimize supplier selection with performance data
- Automate quality control processes
- Prevent financial losses from spoiled inventory

## 🎮 Usage

1. Launch the system and connect production lines
2. Monitor real-time food classification on conveyor belts
3. Query performance with AI: _"Que linha tem mais produtos estragados?"_
4. Make data-driven decisions about suppliers and operations

---

**Transforming food quality control with AI automation** 🤖
