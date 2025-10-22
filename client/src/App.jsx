import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Input from "./pages/TripPlanner";
import TripPlanner from "./pages/TripPlanner";
import TripMap from "./pages/TripMap";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/user" element={<Input />} />
        <Route path="/trip-planner" element={<TripPlanner />} />
        <Route path="/trip-map" element={<TripMap />} />
      </Routes>
    </Router>
  );
}