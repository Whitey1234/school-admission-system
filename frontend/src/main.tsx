import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import { StudentIdentityProvider } from "./context/StudentIdentityProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StudentIdentityProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StudentIdentityProvider>
  </React.StrictMode>
);