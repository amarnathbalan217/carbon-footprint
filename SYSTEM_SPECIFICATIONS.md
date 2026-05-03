# Carbon Footprint Tracker - System Specifications

## 1. System Overview

The Carbon Footprint Tracker is a modern web application designed to help individuals calculate, monitor, and reduce their daily carbon emissions. The system provides real-time tracking, AI-powered travel detection, personalized insights, and goal management capabilities.

## 2. Technical Architecture

### 2.1 Frontend Technology Stack
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1
- **Icons**: Lucide React 0.344.0
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: Single Page Application (SPA) with tab-based navigation

### 2.2 Development Environment
- **Node.js**: Version 18+ required
- **Package Manager**: npm
- **Code Quality**: ESLint with TypeScript support
- **Browser Support**: Modern browsers with ES2020 support

### 2.3 Browser APIs Used
- **Geolocation API**: For automatic travel tracking
- **Local Storage**: For data persistence
- **Fetch API**: For potential future API integrations

## 3. System Features & Modules

### 3.1 Dashboard Module
- **Purpose**: Central hub for carbon footprint overview
- **Components**: 
  - StatsCard: Monthly/yearly emission summaries
  - EmissionsChart: Time-series visualization
  - CategoryBreakdown: Pie chart representation
  - RecentActivity: Activity history display
- **Data Sources**: Manual entries, AI-tracked travel data

### 3.2 Activity Logger Module
- **Purpose**: Manual and automatic activity tracking
- **Sub-modules**:
  - Manual Entry: Transport, Energy, Food, Waste logging
  - AI Travel Tracker: Automatic geolocation-based tracking
- **Calculations**: Real-time CO₂ emission calculations using standard factors

### 3.3 AI Travel Tracking System
- **Technology**: Custom geolocation hook (useGeolocation)
- **Features**:
  - Real-time GPS monitoring
  - Speed-based transport mode detection
  - Distance calculation using Haversine formula
  - Automatic emission calculations
- **Transport Modes**: Walking, Cycling, Public Transport, Driving
- **Privacy**: All data processed locally, no external transmission

### 3.4 Goals Management Module
- **Purpose**: Sustainability goal setting and progress tracking
- **Features**:
  - Custom goal creation with deadlines
  - Progress visualization
  - Achievement system
  - Performance analytics

### 3.5 Insights & Analytics Module
- **Purpose**: Personalized recommendations and trend analysis
- **Features**:
  - AI-generated suggestions for emission reduction
  - Comparative analysis (national, global, city averages)
  - Trend identification and explanations
  - Impact calculations for recommended actions

### 3.6 Profile & Settings Module
- **Purpose**: User preferences and account management
- **Features**:
  - Personal information management
  - Tracking preferences configuration
  - Notification settings
  - Privacy controls

## 4. Data Models & Structures

### 4.1 User Profile
```typescript
interface UserProfile {
  name: string;
  email: string;
  location: string;
  householdSize: string;
  primaryVehicle: 'gas' | 'hybrid' | 'electric' | 'none';
  homeType: 'apartment' | 'house' | 'condo' | 'other';
}
```

### 4.2 Activity Entry
```typescript
interface ActivityEntry {
  id: string;
  category: 'transport' | 'energy' | 'food' | 'waste';
  description: string;
  emissions: number;
  timestamp: Date;
  source: 'manual' | 'auto';
}
```

### 4.3 Travel Segment (AI Tracking)
```typescript
interface TravelSegment {
  startPosition: Position;
  endPosition: Position;
  distance: number;
  duration: number;
  transportMode: 'walking' | 'cycling' | 'driving' | 'public_transport';
  emissions: number;
}
```

### 4.4 Carbon Goal
```typescript
interface CarbonGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
  category: string;
  progress: number;
}
```

## 5. Emission Calculation Factors

### 5.1 Transport Emissions (tons CO₂ per mile)
- **Walking**: 0.000 tons
- **Cycling**: 0.000 tons
- **Public Transport**: 0.030 tons
- **Car (Gas)**: 0.120 tons
- **Hybrid Car**: 0.080 tons
- **Electric Car**: 0.040 tons

### 5.2 Energy Emissions
- **Electricity**: 0.0005 tons CO₂ per kWh
- **Natural Gas**: 0.0053 tons CO₂ per therm

### 5.3 Food Emissions (per meal)
- **Beef**: 0.250 tons CO₂
- **Chicken**: 0.120 tons CO₂
- **Fish**: 0.100 tons CO₂
- **Vegetarian**: 0.080 tons CO₂
- **Vegan**: 0.050 tons CO₂

### 5.4 Waste Emissions
- **General Waste**: 0.010 tons CO₂ per pound

## 6. AI Travel Detection Algorithm

### 6.1 Speed-Based Classification
- **Walking**: 0-4 mph
- **Cycling**: 4-15 mph
- **Public Transport**: 15-35 mph
- **Driving**: 35+ mph

### 6.2 Movement Detection Logic
1. Continuous GPS monitoring with 30-second intervals
2. Distance calculation using Haversine formula
3. Speed analysis over time windows
4. Movement start/stop detection (5-minute threshold)
5. Transport mode classification based on average speed
6. Automatic emission calculation and logging

## 7. Performance Specifications

### 7.1 Response Times
- **Page Load**: < 2 seconds
- **Navigation**: < 500ms
- **Chart Rendering**: < 1 second
- **GPS Location Update**: 30 seconds

### 7.2 Data Storage
- **Local Storage**: Browser localStorage for user data
- **Data Persistence**: Automatic save on user actions
- **Storage Limit**: ~5MB per user (browser limitation)

### 7.3 Battery Optimization
- **GPS Sampling**: Optimized intervals to minimize battery drain
- **Background Processing**: Efficient algorithms for location tracking
- **User Control**: Manual start/stop for tracking

## 8. Security & Privacy

### 8.1 Data Privacy
- **Local Processing**: All location data processed on device
- **No External Transmission**: Location data never sent to servers
- **User Control**: Full control over tracking start/stop
- **Data Ownership**: Users own all their data

### 8.2 Browser Security
- **HTTPS Required**: Geolocation API requires secure context
- **Permission-Based**: User must grant location permissions
- **Graceful Degradation**: App functions without location access

## 9. Browser Compatibility

### 9.1 Supported Browsers
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### 9.2 Required Features
- **ES2020 Support**: Modern JavaScript features
- **Geolocation API**: For travel tracking
- **Local Storage**: For data persistence
- **CSS Grid/Flexbox**: For responsive layout

## 10. Deployment Specifications

### 10.1 Build Configuration
- **Build Tool**: Vite with React plugin
- **Output**: Static files (HTML, CSS, JS)
- **Optimization**: Code splitting, minification, tree shaking
- **Assets**: Optimized images and fonts

### 10.2 Hosting Requirements
- **Type**: Static hosting (CDN-friendly)
- **HTTPS**: Required for geolocation features
- **Bandwidth**: Low (static assets only)
- **Storage**: Minimal server storage needed

## 11. Future Enhancements

### 11.1 Planned Features
- **Data Export**: CSV/JSON export functionality
- **Social Sharing**: Share achievements and progress
- **Offline Mode**: Service worker for offline functionality
- **Advanced Analytics**: Machine learning insights

### 11.2 Scalability Considerations
- **Database Integration**: Future backend integration
- **User Authentication**: Account management system
- **API Development**: RESTful API for mobile apps
- **Cloud Sync**: Cross-device data synchronization

## 12. Testing Specifications

### 12.1 Unit Testing
- **Coverage**: Authentication logic, API endpoints, AI Assistant integration, and emission calculation formulas.
- **Mocking**: LocalStorage, external AI API endpoints.

### 12.2 Integration Testing
- **Focus**: Frontend-backend HTTP communication, database execution (SQLite), and local storage data persistence.

### 12.3 System Testing
- **Focus**: End-to-end user journeys (registration to dashboard) and administrator workflows.

### 12.4 Performance Testing
- **Focus**: Handling concurrent database connections, maintaining API response times under 2 seconds, and efficient resource usage.

### 12.5 User Acceptance Testing (UAT)
- **Focus**: UI/UX usability feedback, language localization (English/Malayalam) accuracy, and cross-platform mobile functionality.

## 13. Maintenance & Support

### 13.1 Code Maintenance
- **Modular Architecture**: Easy component updates
- **TypeScript**: Type safety for maintainability
- **Documentation**: Comprehensive code comments
- **Version Control**: Git-based development workflow

### 13.2 User Support
- **Error Handling**: Graceful error messages
- **Help Documentation**: In-app guidance
- **Feedback System**: User feedback collection
- **Update Mechanism**: Easy deployment updates

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Development Team