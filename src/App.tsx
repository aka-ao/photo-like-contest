import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import ListPage from "./ListPage";

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/" Component={ListPage} />
          <Route path="/list" Component={ListPage} />
          {/* 他のルートをここに追加 */}
        </Routes>
      </Router>
  );
}

export default App;
