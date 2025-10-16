import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Input from "./pages/user"
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/user" element={<Input />} />
      </Routes>
    </Router>
  );
}
