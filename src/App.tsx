import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import ListPage from "./ListPage";

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<ListPage/>} />
          <Route path="/list" element={<ListPage/>} />
          {/* 他のルートをここに追加 */}
        </Routes>
      </Router>
  );
}

export default App;
