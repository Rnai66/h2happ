// frontend/src/api.js
import axios from "axios";
import { Capacitor } from "@capacitor/core";

let API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || "http://10.0.2.2:4010/api";

if (Capacitor.isNativePlatform()) {
  API_BASE_URL = "http://10.0.2.2:4010/api";
}

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// ดึง token จาก localStorage ใส่ header ทุก request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("h2h_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
