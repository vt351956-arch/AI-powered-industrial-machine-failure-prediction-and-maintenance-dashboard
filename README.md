# AI-Powered Predictive Maintenance for Industry 4.0

A comprehensive predictive maintenance system for industrial equipment using machine learning, real-time sensor monitoring, and intelligent alerting.

## 📋 Project Overview

This project demonstrates a complete Industry 4.0 predictive maintenance solution that combines:
- Real-time sensor data monitoring
- Machine learning-based failure prediction
- Automated anomaly detection
- Maintenance scheduling and tracking
- Role-based access control
- Interactive dashboards and visualizations

## 🎯 Problem Statement

Industrial equipment failures can lead to:
- Unplanned downtime
- High maintenance costs
- Safety risks
- Production delays

Traditional reactive maintenance is inefficient. This system enables **predictive maintenance** by:
- Monitoring equipment health in real-time
- Predicting failures before they occur
- Optimizing maintenance schedules
- Reducing operational costs

## 💡 Solution

A full-stack web application that:
1. **Collects** sensor data (temperature, vibration, pressure, RPM, power consumption)
2. **Analyzes** data using Random Forest for failure prediction
3. **Detects** anomalies using Isolation Forest
4. **Alerts** operators to high-risk equipment
5. **Tracks** maintenance activities
6. **Visualizes** trends and metrics in real-time

## ✨ Key Features

### Core Functionality
- **Authentication & Authorization**: JWT-based auth with role-based access (admin, engineer, viewer)
- **Machine Management**: Full CRUD operations for industrial equipment
- **Sensor Monitoring**: Real-time sensor data visualization
- **AI Prediction Center**: Run ML predictions on demand
- **System Alerts**: Automated alerts for high-risk machines and anomalies
- **Maintenance Management**: Track preventive and corrective maintenance
- **Interactive Dashboard**: KPIs, charts, and trend analysis

### Machine Learning
- **Random Forest Classifier**: Predicts failure probability and health scores
- **Isolation Forest**: Detects sensor anomalies in real-time
- **Feature Engineering**: Temperature, vibration, pressure, RPM, power, operating hours

### User Interface
- **Industry 4.0 Design**: Dark theme with professional industrial aesthetics
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live data refresh and state management
- **Role-Based UI**: Controls and actions based on user permissions

## 🛠 Technology Stack

### Frontend
- **React 19**: Modern React with hooks and concurrent features
- **Vite 8**: Fast build tool and dev server
- **React Router 7**: Client-side routing
- **Tailwind CSS 4**: Utility-first CSS framework
- **Recharts**: Data visualization library
- **Lucide React**: Icon library
- **Axios**: HTTP client for API requests

### Backend
- **FastAPI**: Modern Python web framework
- **Pydantic**: Data validation and serialization
- **SQLAlchemy**: ORM for database operations
- **PostgreSQL**: Relational database
- **JWT**: JSON Web Tokens for authentication
- **Python 3.11+**: Runtime environment

### Machine Learning
- **scikit-learn**: ML algorithms (Random Forest, Isolation Forest)
- **pandas**: Data manipulation
- **numpy**: Numerical computing
- **joblib**: Model serialization

## 🏗 System Architecture

```
┌─────────────────┐
│   React App     │
│  (Frontend)     │
└────────┬────────┘
         │ HTTP/JSON
         ↓
┌─────────────────┐
│   FastAPI       │
│  (Backend)      │
└────────┬────────┘
         │ SQLAlchemy
         ↓
┌─────────────────┐
│  PostgreSQL     │
│  (Database)     │
└─────────────────┘

Sensor Data → ML Service → Prediction → Alert → Maintenance
```

## 🤖 ML Approach

### Random Forest Classifier
- **Purpose**: Predict failure probability and calculate health scores
- **Features**: Temperature, vibration, pressure, RPM, power consumption, operating hours
- **Output**: Failure probability (0-1), health score (0-100), risk level (LOW/MEDIUM/HIGH)
- **Model Version**: random-forest-v1

### Isolation Forest
- **Purpose**: Unsupervised anomaly detection
- **Features**: Multivariate sensor data
- **Output**: Anomaly flag, anomaly score
- **Use Case**: Detect unexpected sensor patterns

### Training Data
**Important**: The model is trained on **synthetic demonstration data** generated using physics-grounded industrial telemetry simulation. The reported accuracy metrics (e.g., 99.86%) are on this synthetic dataset and do not represent guaranteed real-world industrial performance.

## 🗄 Database

### Major Tables
- **users**: User accounts with roles (admin, engineer, viewer)
- **machines**: Industrial equipment registry
- **sensor_readings**: Time-series sensor data
- **predictions**: ML prediction history
- **maintenance_records**: Maintenance activity logs

### Relationships
- Machines have many sensor readings
- Machines have many predictions
- Machines have many maintenance records
- Predictions are linked to machines
- Maintenance records are linked to machines

## 📡 API Overview

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (returns JWT)
- `POST /api/auth/logout` - User logout

### Machines
- `GET /api/machines` - List machines (with search/filters)
- `POST /api/machines` - Create machine
- `GET /api/machines/{id}` - Get machine details
- `PUT /api/machines/{id}` - Update machine
- `DELETE /api/machines/{id}` - Delete machine

### Sensors
- `GET /api/sensors` - List sensor readings
- `GET /api/sensors/latest/{machine_id}` - Get latest reading for machine

### Predictions
- `POST /api/predictions/predict` - Run ML prediction
- `GET /api/predictions` - Get prediction history
- `GET /api/predictions/model-info` - Get ML model metadata

### Alerts
- `GET /api/alerts` - Get system alerts (with filters)

### Maintenance
- `GET /api/maintenance` - List maintenance records
- `POST /api/maintenance` - Create maintenance record
- `GET /api/maintenance/{id}` - Get maintenance record
- `PUT /api/maintenance/{id}` - Update maintenance record
- `DELETE /api/maintenance/{id}` - Delete maintenance record

### Dashboard
- `GET /api/dashboard/summary` - Dashboard KPIs and charts data

## 📁 Project Structure

```
AI-Powered Predictive Maintenance for Industry 4.0/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context (Auth)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   └── main.jsx         # Application entry point
│   ├── package.json
│   └── vite.config.js
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API route handlers
│   │   ├── services/        # Business logic (ML service)
│   │   ├── database.py      # Database configuration
│   │   └── main.py          # FastAPI application
│   └── requirements.txt
├── ml/                      # Machine learning scripts
│   ├── train_model.py       # Model training script
│   └── models/              # Trained model files
├── database/                # Database scripts
│   └── init_db.py           # Database initialization
├── docs/                    # Documentation
│   ├── architecture.md      # System architecture details
│   └── api.md              # API documentation
├── .env.example             # Environment variables template
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🚀 Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3 .11+
- PostgreSQL 14+
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd AI-Powered-Predictive-Maintenance-for-Industry-4.0
```

### 2. Set Up PostgreSQL
```bash
# Create database
createdb predictive_maintenance

# Or use psql
psql -U postgres
CREATE DATABASE predictive_maintenance;
```

### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp ../.env.example .env
# Edit .env with your database credentials and JWT secret
```

### 4. Initialize Database
```bash
cd ../database
python init_db.py
```

### 5. Train ML Model (Optional)
```bash
cd ../ml
python train_model.py
```

### 6. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install
```

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/predictive_maintenance

# JWT Secret
JWT_SECRET=your-secret-key-here-change-in-production

# CORS
CORS_ORIGINS=http://localhost:5173
```

## ▶️ Running the Application

### Start Backend
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

API Documentation (Swagger): `http://localhost:8000/docs`

### Start Frontend
```bash
cd frontend
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## 🧪 Demo Credentials

After running the database initialization script, the following demo users are created:

**Admin User**
- Email: `admin@example.com`
- Password: `admin123`
- Role: Full access to all features

**Engineer User**
- Email: `engineer@example.com`
- Password: `engineer123`
- Role: Can create/edit machines and maintenance, cannot delete

**Viewer User**
- Email: `viewer@example.com`
- Password: `viewer123`
- Role: Read-only access

⚠️ **Important**: These are demo credentials only. Change passwords in production.

## 📸 Screenshots

*(Screenshots section - add actual screenshots of the application)*

- Dashboard with KPIs and charts
- Machines management page
- Machine details with sensor readings
- AI Prediction Center
- System Alerts page
- Maintenance Management page

## ⚠️ Limitations

1. **Synthetic Data**: The ML model is trained on synthetic demonstration data. Real-world performance may vary.
2. **Demo Metrics**: Reported accuracy (99.86%) is on synthetic dataset, not real-world industrial data.
3. **No Guarantee**: The system does not guarantee failure prediction. It provides risk estimates based on historical patterns.
4. **Single-Tenant**: Currently designed for single-organization use.
5. **Real-Time**: Sensor data ingestion is simulated for demonstration. Real IoT integration requires additional components.

## 🔮 Future Enhancements

- Real IoT sensor data ingestion (MQTT, Modbus, etc.)
- Multi-tenant support
- Advanced anomaly detection algorithms
- Automated maintenance scheduling
- Mobile app (React Native)
- Email/SMS notifications
- Integration with CMMS systems
- Historical data archiving
- Advanced reporting and export
- Model retraining pipeline
- A/B testing for ML models

## 📄 License

This project is for educational and demonstration purposes.

## 👥 Contributing

This is a demonstration project. For production use, additional security, testing, and validation are required.

## 📞 Support

For questions or issues, please refer to the documentation in the `docs/` directory.

---

**Built for Industry 4.0 Demonstration**
