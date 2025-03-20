import React from 'react';

interface ThemeSwitcherProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, onThemeToggle }) => {
  return <button onClick={onThemeToggle}>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</button>;
};

export default ThemeSwitcher;
