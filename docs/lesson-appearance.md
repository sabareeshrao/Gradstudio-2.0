# Lesson appearance compatibility

All 45 published modules retain their original lesson HTML, JavaScript, interactions and stable IDs. The latest detailed GPU guide already uses the target neutral adaptive palette; the other 44 lesson HTML files append scoped media-query palette rules. Content remains independently deployed. Embedded lessons respond to the application's CSS color-scheme through prefers-color-scheme, without iframe reload, messages, network permissions or sandbox changes.

Neutral reading surfaces are white (#ffffff) and dark gray (#212121). Original diagram palettes and terminal/code syntax are preserved; some legacy diagrams intentionally remain on their original illustration surface rather than being inverted. The browser appearance check verifies the reading background, media changes and preserved frame state at desktop/mobile widths for every published module. It is not a full individual accessibility or interaction audit.

The credential-free review workflow uses a pinned public application revision only for its locked Playwright test tooling. It is not a content-runtime dependency. No production deployment authorization.
