// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import HomeListings from "./pages/HomeListings";
import Home from "./pages/common/Home";

import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import AuthCombined from "./pages/auth/AuthCombined";

import Items from "./pages/items/Items";
import ItemDetail from "./pages/items/ItemDetail";

import Checkout from "./pages/checkout/Checkout";

import MainLayout from "./layouts/MainLayout";

import ChatList from "./pages/chat/ChatList";
import ChatRoom from "./pages/chat/ChatRoom";

import SellItem from "./pages/SellItem"; // ✅ ใช้ตัวนี้ตัวเดียว
import Orders from "./pages/orders/Orders";
import OrderDetail from "./pages/orders/OrderDetail";
import Search from "./pages/Search";


// NEW: Admin Payments Page
import AdminPaymentsPage from "./pages/AdminPaymentsPage";

// ✅ My Listings
import MyListings from "./pages/seller/MyListings.jsx";
import PayCancel from "./pages/pay/PayCancel";

export default function App() {
  return (
    <Routes>
      {/* ✅ หน้าแรก: ฟีดรายการสินค้า */}
      <Route path="/" element={<HomeListings />} />

      {/* ✅ My Listings */}
      <Route path="/me/listings" element={<MyListings />} />

      {/* ✅ Redirect /profile → /me/listings */}
      <Route path="/profile" element={<Navigate to="/me/listings" replace />} />

      {/* (ถ้ายังอยากเข้า Home เดิม) */}
      <Route path="/home" element={<Home />} />

      {/* ✅ Auth – ใช้ AuthCombined เป็นหลัก */}
      <Route path="/auth" element={<AuthCombined />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/login" element={<Login />} />

      {/* Redirect สั้น ๆ */}
      <Route path="/login" element={<Navigate to="/auth?tab=login" replace />} />
      <Route
        path="/register"
        element={<Navigate to="/auth?tab=register" replace />}
      />

      {/* ✅ Items */}
      <Route path="/items" element={<Items />} />
      <Route path="/items/:id" element={<ItemDetail />} />
      <Route path="/checkout" element={<Checkout />} />

      {/* ✅ Chat */}
      <Route path="/chat" element={<ChatList />} />
      <Route path="/chat/:id" element={<ChatRoom />} />

      {/* ✅ Sell & Orders */}
      <Route path="/sell" element={<SellItem />} />
      <Route path="/sell/item" element={<Navigate to="/sell" replace />} />

      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/:id" element={<OrderDetail />} />
      <Route path="/search" element={<Search />} />


      {/* ✅ Admin Payments */}
      <Route path="/admin/payments" element={<AdminPaymentsPage />} />
      <Route path="/pay/cancel" element={<PayCancel />} />

      {/* ✅ 404 */}
      <Route
        path="*"
        element={
          <MainLayout>
            <p className="p-4">ไม่พบหน้า</p>
          </MainLayout>
        }
      />
    </Routes>
  );
}
