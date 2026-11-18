// src/components/manager/ManagerLayout.tsx
// サイドバーは ManagerSidebar コンポーネントに切り出し済み。AdminLayout と同じ見た目・CSSを再利用する。
import { useEffect, useState } from "react";
import { type Manager } from "../../lib/managerApi";
import ManagerSidebar from "./ManagerSidebar";
import HeaderItem from "./HeaderItem";
import "../../styles/components/adminLayout.css";

const MOBILE_MEDIA_QUERY = "(max-width: 767.98px)";

type Props = {
  manager: Manager | null;
  onLogout: () => void;
  children: React.ReactNode;
  headerTitle?: string;
  headerAction?: React.ReactNode;
};

export default function ManagerLayout({ manager, onLogout, children, headerTitle, headerAction }: Props) {
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
        <ManagerSidebar
          isOpen={sidebarOpen || isMobileMenuOpen}
          isMobileOpen={isMobileMenuOpen}
          onNavigate={() => setIsMobileMenuOpen(false)}
        />

        {/* メインコンテンツ */}
        <div className={`flex-grow-1 admin-main${sidebarOpen ? "" : " admin-main--expanded"}`}>
          {/* ヘッダー */}
          <HeaderItem
            manager={manager}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            onLogout={onLogout}
            onToggleSidebar={toggleSidebar}
            title={headerTitle}
            action={headerAction}
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
