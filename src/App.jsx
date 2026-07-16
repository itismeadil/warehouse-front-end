import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AddItemForm from "./components/AddItemForm";
import Home from "./components/Home";
import FloorsMap from "./components/FloorsMap";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddItemForm />} />
          <Route path="/floors" element={<FloorsMap />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
