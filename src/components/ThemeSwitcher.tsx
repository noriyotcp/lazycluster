import React from 'react';

interface ThemeSwitcherProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const ThemeSwitcher = ({ theme, onThemeToggle }: ThemeSwitcherProps) => (
  <button onClick={onThemeToggle}>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</button>
);

export default ThemeSwitcher;
