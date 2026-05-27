import { BrowserRouter, Routes, Route } from "react-router-dom";

import Client from "./pages/Client";
import Host from "./pages/Host";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Client />} />
        <Route path="/host" element={<Host />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
