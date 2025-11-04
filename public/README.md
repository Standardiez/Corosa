# UniRide - University Carpooling Web Application

## Project Overview
UniRide is a carpooling web application designed for university communities. It facilitates ride-sharing between students and employees, focusing on campus-related transportation.

## Project Structure
```
uniride-html
├── src
│   ├── assets
│   │   └── styles
│   │       ├── index.css
│   │       ├── tailwind.css
│   │       └── components.css
│   ├── pages
│   │   ├── index.html
│   │   ├── find-ride.html
│   │   ├── pickup-location.html
│   │   └── request-ride.html
│   ├── components
│   │   ├── map-view.js
│   │   ├── ride-card.js
│   │   └── nav-bar.js
│   └── scripts
│       ├── main.js
│       └── utils.js
├── package.json
└── README.md
```

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd uniride-html
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000` to view the application.

## Features
- **Interactive Map**: View available rides on an interactive map.
- **Ride Selection**: Easily select your destination and pickup location.
- **Ride Confirmation**: Confirm your ride and handle payment seamlessly.

## Technologies Used
- HTML, CSS, JavaScript
- Tailwind CSS for styling
- Mapbox GL for map integration

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.