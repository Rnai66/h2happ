// frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
// import "./styles/theme.css"; // ลบหรือ comment ออกถ้าไม่ได้ใช้แล้ว เพราะเราใช้ CSS Variables ใน index.css
import App from "./App";

// Entry point
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
