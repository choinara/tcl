-- Fix menu icon names to match frontend defaultIconMap keys (lowercase kebab-case)
UPDATE system_menu SET icon = 'dashboard'    WHERE icon = 'LayoutDashboard';
UPDATE system_menu SET icon = 'users'        WHERE icon = 'Users';
UPDATE system_menu SET icon = 'settings'     WHERE icon = 'Settings';
UPDATE system_menu SET icon = 'building'     WHERE icon IN ('Building2', 'Building');
UPDATE system_menu SET icon = 'shield-check' WHERE icon IN ('ShieldCheck', 'Shield');
UPDATE system_menu SET icon = 'bell'         WHERE icon = 'Bell';
UPDATE system_menu SET icon = 'key'          WHERE icon = 'KeyRound';
UPDATE system_menu SET icon = 'bar-chart'    WHERE icon = 'BarChart3';
UPDATE system_menu SET icon = 'file-text'    WHERE icon = 'FileText';
UPDATE system_menu SET icon = 'clipboard'    WHERE icon IN ('ClipboardList', 'Menu');
UPDATE system_menu SET icon = 'tag'          WHERE icon IN ('Tag', 'BookOpen');
UPDATE system_menu SET icon = 'layers'       WHERE icon = 'Layers';
UPDATE system_menu SET icon = 'filter'       WHERE icon = 'Palette';
UPDATE system_menu SET icon = 'stamp'        WHERE icon = 'Award';
UPDATE system_menu SET icon = 'globe'        WHERE icon = 'Network';
UPDATE system_menu SET icon = 'users'        WHERE icon IN ('UserCheck', 'UserCog');
UPDATE system_menu SET icon = 'wrench'       WHERE icon = 'Wrench';
