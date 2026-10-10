# System Architecture

## Overview

The AI-Powered Predictive Maintenance system follows a modern three-tier architecture with a machine learning integration layer. The system is designed to be scalable, maintainable, and follows Industry 4.0 best practices.

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│                    React 19 + Vite 8                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Dashboard│  │ Machines │  │Predictions│ │ Alerts   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │Maintenance│ │Machine   │  │Profile   │                  │
│  │Management │ │Details   │  │          │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/JSON (REST API)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                        Backend Layer                           │
│                     FastAPI + Pydantic                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   API Routers                          │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │  │  Auth   │ │Machines │ │Sensors  │ │Predict  │    │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                │  │
│  │  │ Alerts  │ │Maintain │ │Dashboard│                │  │
│  │  └─────────┘ └─────────┘ └─────────┘                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   Business Logic                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │              ML Service                         │   │  │
│  │  │  Random Forest + Isolation Forest              │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │              Auth Service                     │   │  │
│  │  │  JWT Authentication + Role-Based Access       │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ SQLAlchemy ORM
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                            │
│                      PostgreSQL 14+                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │  users  │  │machines │  │sensors  │ │predictions│     │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│  ┌─────────┐                                                   │
│  │maintenance│                                                │
│  └─────────┘                                                   │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack
- **React 19**: UI framework with hooks and concurrent features
- **Vite 8**: Build tool and development server
- **React Router 7**: Client-side routing with protected routes
- **Tailwind CSS 4**: Utility-first CSS framework
- **Recharts**: Data visualization library
- **Lucide React**: Icon library
- **Axios**: HTTP client for API communication

### Component Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.jsx    # Route protection wrapper
│   │   └── AuthProvider.jsx       # Authentication context
│   ├── dashboard/
│   │   ├── DashboardKpiCard.jsx  # KPI display component
│   │   ├── HealthTrendChart.jsx  # Health trend visualization
│   │   ├── RiskTrendChart.jsx    # Failure risk trends
│   │   ├── SensorTrendChart.jsx  # Sensor data trends
│   │   ├── ScatterChart.jsx      # Temperature vs vibration
│   │   ├── MachineHealthChart.jsx# Machine comparison
│   │   ├── MaintenanceCostChart.jsx# Cost trends
│   │   ├── RecentPredictions.jsx # Recent predictions table
│   │   ├── CriticalMachines.jsx  # Critical machines list
│   │   └── RecentAlerts.jsx      # Recent alerts list
│   └── ui/
│       ├── UIComponents.jsx      # Reusable UI components
│       ├── Card.jsx              # Card component
│       ├── Button.jsx            # Button component
│       ├── Input.jsx             # Input component
│       ├── Select.jsx            # Select component
│       ├── StatusBadge.jsx       # Status badge component
│       ├── HealthScoreRing.jsx   # Health score ring
│       ├── PageLoader.jsx        # Loading spinner
│       ├── ErrorState.jsx        # Error display
│       └── EmptyState.jsx        # Empty state display
├── context/
│   └── AuthContext.jsx          # Authentication state management
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx         # Login page
│   │   └── RegisterPage.jsx      # Registration page
│   ├── DashboardPage.jsx         # Main dashboard
│   ├── MachinesPage.jsx          # Machine management
│   ├── MachineDetailsPage.jsx   # Machine details
│   ├── PredictionsPage.jsx      # AI Prediction Center
│   ├── AlertsPage.jsx           # System alerts
│   ├── MaintenancePage.jsx      # Maintenance management
│   └── ProfilePage.jsx          # User profile
├── services/
│   └── api.js                   # API service layer
└── main.jsx                     # Application entry point
```

### State Management
- **React Context**: Authentication state (user, token, role)
- **Local State**: Component-level state using useState/useEffect
- **API State**: Data fetched from backend and stored in component state

### Routing
- **Public Routes**: `/login`, `/register`
- **Protected Routes**: `/dashboard`, `/machines`, `/machines/:id`, `/predictions`, `/alerts`, `/maintenance`, `/profile`
- **Route Protection**: ProtectedRoute component checks authentication
- **Navigation**: React Router's useNavigate for programmatic navigation

## Backend Architecture

### Technology Stack
- **FastAPI**: Modern Python web framework
- **Pydantic**: Data validation and serialization
- **SQLAlchemy**: ORM for database operations
- **PostgreSQL**: Relational database
- **JWT**: JSON Web Tokens for authentication
- **Python 3.11+**: Runtime environment

### Project Structure

```
backend/
├── app/
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── user.py            # User model
│   │   ├── machine.py         # Machine model
│   │   ├── sensor.py           # Sensor reading model
│   │   ├── prediction.py       # Prediction model
│   │   └── maintenance.py      # Maintenance record model
│   ├── schemas/                # Pydantic schemas
│   │   ├── user.py            # User schemas
│   │   ├── machine.py         # Machine schemas
│   │   ├── sensor.py          # Sensor schemas
│   │   ├── prediction.py      # Prediction schemas
│   │   ├── maintenance.py     # Maintenance schemas
│   │   ├── dashboard.py       # Dashboard schemas
│   │   └── alert.py           # Alert schemas
│   ├── routers/                # API route handlers
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── machines.py        # Machine endpoints
│   │   ├── sensors.py         # Sensor endpoints
│   │   ├── predictions.py     # Prediction endpoints
│   │   ├── alerts.py          # Alert endpoints
│   │   ├── maintenance.py     # Maintenance endpoints
│   │   └── dashboard.py       # Dashboard endpoints
│   ├── services/               # Business logic
│   │   └── ml_service.py      # ML service
│   ├── utils/                  # Utilities
│   │   └── dependencies.py    # Auth dependencies
│   ├── database.py             # Database configuration
│   └── main.py                 # FastAPI application
└── requirements.txt            # Python dependencies
```

### API Layer
FastAPI routers handle HTTP requests:
- **Request Validation**: Pydantic schemas validate incoming data
- **Authentication**: JWT tokens verified via dependencies
- **Authorization**: Role-based access control via require_role
- **Response Serialization**: Pydantic schemas format responses
- **Error Handling**: HTTP exceptions with proper status codes

### Database Layer
SQLAlchemy ORM manages database operations:
- **Session Management**: Database sessions per request
- **Model Definitions**: Python classes mapped to database tables
- **Relationships**: Foreign key relationships between models
- **Queries**: SQLAlchemy query API for data retrieval

## Machine Learning Architecture

### ML Service Integration

```
Sensor Data
    ↓
Feature Processing
    ↓
┌─────────────────────────────────┐
│     Random Forest Classifier    │
│  - Failure Probability         │
│  - Health Score                │
│  - Risk Level                  │
│  - Predicted Failure          │
└─────────────────────────────────┘
    ↓
Prediction Result
    ↓
Database Storage
```

### Random Forest Classifier
- **Purpose**: Predict equipment failure probability
- **Input Features**:
  - Temperature (°C)
  - Vibration (mm/s)
  - Pressure (bar)
  - RPM
  - Power Consumption (kW)
  - Operating Hours
- **Outputs**:
  - Failure Probability (0.0 - 1.0)
  - Health Score (0 - 100)
  - Risk Level (LOW/MEDIUM/HIGH)
  - Predicted Failure (boolean)
- **Model Version**: random-forest-v1
- **File**: `ml/models/random_forest_model.joblib`

### Isolation Forest
- **Purpose**: Unsupervised anomaly detection
- **Input Features**: Multivariate sensor data
- **Outputs**:
  - Anomaly Detected (boolean)
  - Anomaly Score (float)
- **Use Case**: Detect unexpected sensor patterns
- **File**: `ml/models/isolation_forest_model.joblib`

### Model Training Pipeline
```
Synthetic Data Generation
    ↓
Feature Engineering
    ↓
Train/Test Split
    ↓
Model Training
    ↓
Model Evaluation
    ↓
Model Serialization
```

### Important Notes
- **Synthetic Data**: Models are trained on physics-grounded synthetic industrial telemetry
- **Demo Metrics**: Reported accuracy (99.86%) is on synthetic dataset
- **No Guarantee**: Predictions are risk estimates, not guarantees
- **Retraining**: Model retraining requires running `ml/train_model.py`

## Data Flow

### Authentication Flow
```
User enters credentials
    ↓
Frontend sends POST /api/auth/login
    ↓
Backend validates credentials
    ↓
Backend generates JWT token
    ↓
Token returned to frontend
    ↓
Frontend stores token (localStorage)
    ↓
Token sent with subsequent requests
    ↓
Backend verifies token on protected routes
```

### Prediction Flow
```
User selects machine
    ↓
Frontend fetches latest sensor data
    ↓
User clicks "Run AI Prediction"
    ↓
Frontend sends POST /api/predictions/predict
    ↓
Backend calls ML service
    ↓
ML service loads Random Forest model
    ↓
Model processes sensor features
    ↓
Prediction returned
    ↓
Backend stores prediction in database
    ↓
Backend updates machine status if needed
    ↓
Prediction returned to frontend
    ↓
Frontend displays results
```

### Alert Generation Flow
```
Backend receives GET /api/alerts
    ↓
Backend queries critical/warning machines
    ↓
Backend queries high/medium risk predictions
    ↓
Backend queries sensor anomalies
    ↓
Backend synthesizes alerts from all sources
    ↓
Alerts sorted by timestamp
    ↓
Alerts filtered by severity/machine if requested
    ↓
Alerts returned to frontend
```

### Maintenance Flow
```
User creates maintenance record
    ↓
Frontend sends POST /api/maintenance
    ↓
Backend validates machine exists
    ↓
Backend creates maintenance record
    ↓
If corrective/overhaul, machine status reset to HEALTHY
    ↓
Record returned to frontend
    ↓
Frontend refreshes maintenance list
```

## Security Architecture

### Authentication
- **JWT Tokens**: Stateless authentication
- **Token Storage**: localStorage in frontend
- **Token Expiration**: Configurable via JWT_SECRET
- **Password Hashing**: bcrypt for password storage

### Authorization
- **Role-Based Access Control**: Three roles (admin, engineer, viewer)
- **Backend Enforcement**: require_role dependency on protected endpoints
- **Frontend UI**: Controls hidden based on user role
- **Permissions**:
  - **Admin**: Full access (create, read, update, delete)
  - **Engineer**: Create/read/update machines and maintenance
  - **Viewer**: Read-only access

### API Security
- **CORS**: Configured for frontend origin
- **SQL Injection Prevention**: SQLAlchemy ORM parameterized queries
- **XSS Prevention**: React auto-escapes content
- **Environment Variables**: Secrets stored in .env (not committed)

## Performance Considerations

### Frontend
- **Code Splitting**: Vite handles automatic code splitting
- **Lazy Loading**: Components loaded on demand
- **Bundle Size Warning**: Current bundle ~833KB (acceptable for demo)
- **Optimization**: Recharts bundle can be optimized with dynamic imports

### Backend
- **Database Indexing**: Foreign keys indexed for faster queries
- **Query Optimization**: SQLAlchemy query optimization
- **Pagination**: List endpoints support limit/skip
- **Connection Pooling**: SQLAlchemy connection pooling

### ML Service
- **Model Loading**: Models loaded once on startup
- **Prediction Latency**: < 100ms per prediction
- **Model Size**: Random Forest ~500KB, Isolation Forest ~200KB

## Scalability Considerations

### Horizontal Scaling
- **Frontend**: Static files can be served via CDN
- **Backend**: Stateless design allows multiple instances
- **Database**: PostgreSQL supports read replicas

### Vertical Scaling
- **Frontend**: Vite build optimization
- **Backend**: Gunicorn with multiple workers
- **Database**: Connection pooling, query optimization

### Future Enhancements
- **Caching**: Redis for frequently accessed data
- **Message Queue**: Celery for async tasks (predictions, alerts)
- **Real-time**: WebSocket for live sensor updates
- **Load Balancing**: Nginx for backend load balancing
