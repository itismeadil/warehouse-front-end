import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AddItemForm from "./components/AddItemForm";
import Home from "./components/Home";
import FloorsMap from "./components/FloorsMap";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddItemForm />} />
        <Route path="/floors" element={<FloorsMap />} />
      </Routes>
    </Router>
  );
}

export default App;
