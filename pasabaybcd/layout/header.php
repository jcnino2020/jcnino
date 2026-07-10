<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PasabayBCD - Admin Control Panel</title>
<link rel="icon" type="image/png" href="assets/app-icon.png">
<link rel="shortcut icon" href="assets/app-icon.png">
<link rel="apple-touch-icon" href="assets/app-icon.png">
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
<style>
  .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
  body { font-family: 'Inter', sans-serif; background: #f8f9ff; color: #1e293b; font-size: 15px; padding-bottom: env(safe-area-inset-bottom); }
  .glass-panel { background: rgba(255,255,255,0.88); backdrop-filter: blur(14px); }
  #sidebar { background: #ffffff; border-right: 1px solid #e5eeff; transition: width 0.2s ease; overflow-y: auto; }
  .sidebar-link { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 4px; font-size: 0.875rem; font-weight: 500; color: #434655; transition: all 0.15s; }
  .sidebar-link:hover { background: #eff4ff; color: #004ac6; }
  .sidebar-link.active { background: #eff4ff; color: #004ac6; font-weight: 700; box-shadow: inset 3px 0 0 #004ac6; }
  .sidebar-link .sicon { width: 26px; height: 26px; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: transparent; flex-shrink: 0; font-size: 18px; }
  .sidebar-link.active .sicon { background: #e5eeff; }
  .stat-card { background: #fff; border-radius: 4px; border-bottom: 2px solid #004ac6; padding: 24px; }
  .data-table thead tr { background: #f1f5f9; }
  .data-table thead th { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: #475569; padding: 14px 24px; border-bottom: 1px solid #e2e8f0; }
  .data-table tbody tr { border-bottom: 1px solid #f1f5f9; }
  .data-table tbody tr:hover { background: #eff4ff; }
  .data-table tbody td { padding: 16px 24px; font-size: 0.875rem; }
  .data-table th:not(:last-child), .data-table td:not(:last-child) { border-right: 1px dashed #e2e8f0; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
  .badge-transit { background:#dbeafe; color:#1d4ed8; }
  .badge-pending { background:#fef3c7; color:#b45309; }
  .badge-delivered { background:#dcfce7; color:#166534; }
  .badge-cancelled { background:#fee2e2; color:#b91c1c; }
  .badge-verified { background:#dcfce7; color:#166534; }
  .badge-rejected { background:#fee2e2; color:#b91c1c; }
  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #c3c6d7; border-radius: 2px; }
</style>
</head>
<body class="text-on-surface min-h-screen overflow-x-hidden">
