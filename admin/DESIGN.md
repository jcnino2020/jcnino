# Portfolio Admin

The admin extends the main website’s existing visual system. It uses the shared Helvetica Neue web fonts from `assets/portfolio.css`, a black canvas (#000), neutral surfaces (#0f0f0f), gray dividers (#1f1f1f), white text and primary actions, and muted gray supporting text (#a0a0a0).

The workspace preserves existing navigation, media editing, analytics, authentication, backups, settings, and save/publish actions. Photography leads the library; compact controls and flat panels support operational tasks. Cards and inputs use 4px corners, while the command dock and dialogs use 8px corners. Navigation uses white active states; status and destructive actions retain semantic colors.

All five admin routes load `workspace.css` after the public and base admin styles. This stylesheet adapts the public visual identity for dense forms, tables, media grids, drawers, and mobile navigation. Keyboard focus uses a visible white outline. Reduced motion preferences remain respected.
