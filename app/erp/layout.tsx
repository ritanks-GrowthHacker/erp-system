'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ErpLayoutProps {
  children: ReactNode;
}

export default function ErpLayout({ children }: ErpLayoutProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/erp',
      icon: '📊',
      current: pathname === '/erp',
    },
    {
      name: 'Inventory',
      href: '/erp/inventory',
      icon: '📦',
      current: pathname?.startsWith('/erp/inventory'),
      submenu: [
        { name: 'Products', href: '/erp/inventory/products' },
        { name: 'Categories', href: '/erp/inventory/categories' },
        { name: 'Stock Levels', href: '/erp/inventory/stock-levels' },
        { name: 'Warehouses', href: '/erp/inventory/warehouses' },
        { name: 'Stock Movements', href: '/erp/inventory/movements' },
        { name: 'Adjustments', href: '/erp/inventory/adjustments' },
        { name: 'Analytics', href: '/erp/inventory/analytics' },
        { name: 'Alerts', href: '/erp/inventory/alerts' },
      ],
    },
    {
      name: 'Purchasing',
      href: '/erp/purchasing',
      icon: '🛒',
      current: pathname?.startsWith('/erp/purchasing'),
      submenu: [
        { name: 'Purchase Orders', href: '/erp/purchasing/orders' },
        { name: 'Suppliers', href: '/erp/purchasing/suppliers' },
        { name: 'Requests for Quotation', href: '/erp/purchasing/rfq' },
      ],
    },
    {
      name: 'Sales',
      href: '/erp/sales',
      icon: '💰',
      current: pathname?.startsWith('/erp/sales'),
      submenu: [
        { name: 'Sales Orders', href: '/erp/sales/orders' },
        { name: 'Customers', href: '/erp/sales/customers' },
        { name: 'Quotations', href: '/erp/sales/quotations' },
        { name: 'Invoices', href: '/erp/sales/invoices' },
      ],
    },
    {
      name: 'Manufacturing',
      href: '/erp/manufacturing',
      icon: '🏭',
      current: pathname?.startsWith('/erp/manufacturing'),
      submenu: [
        { name: 'Manufacturing Orders', href: '/erp/manufacturing/orders' },
        { name: 'Bill of Materials', href: '/erp/manufacturing/bom' },
      ],
    },
    {
      name: 'Reports',
      href: '/erp/reports',
      icon: '📈',
      current: pathname?.startsWith('/erp/reports'),
    },
    {
      name: 'Settings',
      href: '/erp/settings',
      icon: '⚙️',
      current: pathname?.startsWith('/erp/settings'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">ERP System</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <div key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.current
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
              
              {/* Submenu */}
              {item.submenu && item.current && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.submenu.map((subitem) => (
                    <Link
                      key={subitem.name}
                      href={subitem.href}
                      className={`block px-3 py-1.5 rounded-md text-xs transition-colors ${
                        pathname === subitem.href
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      {subitem.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Info */}
        <div className="h-16 border-t border-gray-800 px-6 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">
              U
            </div>
            <div className="text-sm">
              <div className="font-medium">User Name</div>
              <div className="text-xs text-gray-400">Manager</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {navigation.find((item) => item.current)?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <span className="text-xl">🔔</span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <span className="text-xl">❓</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
