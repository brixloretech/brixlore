declare module "*.css";

interface Window {
  // Matomo async tracking queue. Populated before matomo.js loads.
  _paq: Array<Array<string | number | boolean | null | undefined>>;
}
