import theme from './theme.config';

export function injectTheme() {
  const r = document.documentElement.style;
  const c = theme.colors;
  r.setProperty('--b-primary',  c.primary);
  r.setProperty('--b-accent',   c.accent);
  r.setProperty('--b-accent2',  c.accent2);
  r.setProperty('--b-ink',      c.ink);
  r.setProperty('--b-canvas',   c.canvas);
  r.setProperty('--b-canvas2',  c.canvas2);
  r.setProperty('--b-canvas3',  c.canvas3);
  r.setProperty('--b-mist',     c.mist);
}