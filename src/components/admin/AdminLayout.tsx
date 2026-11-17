// src/components/admin/AdminLayout.tsx
// サイドバーは AdminSidebar コンポーネントに切り出し済み。
import { useEffect, useState } from "react";
import { type Admin } from "../../lib/adminApi";
import AdminSidebar from "./AdminSidebar";
import HeaderItem from "./HeaderItem";
import "../../styles/components/adminLayout.css";

const MOBILE_MEDIA_QUERY = "(max-width: 767.98px)";

type Props = {
  admin: Admin | null;
  onLogout: () => void;
  children: React.ReactNode;
  headerTitle?: string;
  headerAction?: React.ReactNode;
  headerBreadcrumb?: { label: string; to: string };
};

export default function AdminLayout({ admin, onLogout, children, headerTitle, headerAction, headerBreadcrumb }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // スマホ幅ではメニューを引き出し、PC 幅ではこれまでどおり細くする
  const toggleSidebar = () => {
    if (window.matchMedia(MOBILE_MEDIA_QUERY).matches) {
      setIsMobileMenuOpen((previous) => !previous);
    } else {
      setSidebarOpen((previous) => !previous);
    }
  };

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const closeOnEscape = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMobileMenuOpen]);

  return (
    <div className="min-vh-100 admin-shell">
      <div className="d-flex">
        {/* 左サイドバー（スマホ幅では背景を押すと閉じる） */}
        {isMobileMenuOpen && (
          <button
            type="button"
            className="admin-sidebar-backdrop d-md-none"
            aria-label="メニューを閉じる"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        <AdminSidebar
          isOpen={sidebarOpen}
          isMobileOpen={isMobileMenuOpen}
          onNavigate={() => setIsMobileMenuOpen(false)}
        />

        {/* メインコンテンツ */}
        <div className={`flex-grow-1 admin-main${sidebarOpen ? "" : " admin-main--expanded"}`}>
          {/* ヘッダー */}
          <HeaderItem
            admin={admin}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            onLogout={onLogout}
            onToggleSidebar={toggleSidebar}
            title={headerTitle}
            action={headerAction}
            breadcrumb={headerBreadcrumb}
          />

          {/* 各ページ固有のコンテンツ */}
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
