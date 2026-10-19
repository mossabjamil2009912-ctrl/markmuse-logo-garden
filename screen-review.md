# TAMKEEN reference redesign coverage

## Inventory
- Content routes: `/` and `/downloads` (2).
- Existing API routes preserved: `/api/tts`, `/api/public/orders`, `/api/public/wa-invoice` (3).
- Root error and not-found views are additional fallback views, not content routes.
- The main page uses internal workflow states, not independent URLs. Static enumeration found 96 distinct state literals; this is not a count of individually tested screens.
- The product catalog currently displays 20 models.

## Reference mapping
| Approved reference | Existing screen | Work and evidence |
| --- | --- | --- |
| Welcome | StartScreen | Original emblem, existing approved background, red start action; mobile capture |
| Home | HomeDashboard | Banner, makers, four service cards, mobile navigation; mobile and desktop captures |
| Project categories | OptionGrid | Five existing choices retained; mobile capture and residential entry interaction |
| Product categories | ProductsCatalog | Shared brand and category cards; mobile and desktop captures |
| Product listing | AllProductsView / ProductCard | Banner, manufacturers, search, existing specifications; 20 models and search 635 yielding one model verified |
| Product detail | ProductDetail | Brand, original photo and existing expandable sections; specifications and catalog opening verified |
| Quote | QuoteCard | Brand letterhead, red header, actual item photos, responsive specifications, quantities and prices; residential input → design → formal quote verified |

The references guide this pass, but pixel-perfect equivalence has not been established. In particular, the product detail's photo remains more prominent than in the reference.

## Shared presentation applied
Global semantic palette, self-hosted fonts, buttons, inputs, cards and tables now reach the existing forms and overlays. Additional presentation changes were applied to studies, study gates, custom SLD input, PDF import, quote alternatives, contact, notifications, orders, purchase and administration. Their business logic and API files were not changed.

## Verified
- Automated regression: all 3 existing test files, 6 tests passed.
- Corrected the routing test harness to exclude the full HTML document shell when mounting inside jsdom.
- Browser: mobile 390×844; desktop 1440×1000; quote also checked at 1280×1800.
- Start, home, product categories/list/detail/specifications/catalog, project categories, residential consumption and quote creation, sidebar collapse/restore.
- Actual catalog page content was rendered, not just the loading overlay.
- Settings, engineering menu, custom SLD input, downloads and not-found page opened without horizontal overflow or page errors.
- The quote download button was clicked, but saved PDF content and all report downloads were not independently inspected.

## Remaining verification / completion
- All 96 workflow states have not been individually visited, visually reviewed or tested end-to-end.
- Authenticated administration, saved orders, payment approval, hosted accounts, permissions, messaging and external integrations were not verified with a real authorized account. No records or permissions were altered for testing.
- Engineering result charts, full SLD drawing interactions, paid study release and every report export still need their own end-to-end checks.
- All manufacturer filters, all product details and all Arabic/English catalogs need exhaustive checks; one Jinko detail/catalog was exercised end-to-end.
- Existing contact action returned to the home screen during the navigation check; the contact popup itself was not confirmed.
- Electron shell/configuration was inspected and preserved; no updated Windows archive was built, and no Windows/offline desktop run was performed. Browser desktop checks do not prove Windows packaging.
- Final reference-by-reference visual reconciliation and exhaustive mobile/desktop review are not complete.

## Scope preservation
No new framework, routing architecture, demo catalog, replacement calculation model, account system or payment integration was introduced. Existing local media and Electron/offline voice boundaries remain intact.