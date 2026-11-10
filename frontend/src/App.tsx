import { Routes, Route } from "react-router";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import MyApplications from "./pages/MyApplications";


export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/my-applications" element={<MyApplications />} />
        <Route path="*" element={<div className="p-10 text-center">Page not found.</div>} />
      </Routes>
    </>
  );
}