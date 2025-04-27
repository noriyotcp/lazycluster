import tailwindColors from 'tailwindcss/colors';

const deprecatedColors = ['lightBlue', 'warmGray', 'trueGray', 'coolGray', 'blueGray'];

const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

const colorSafeList = [];

for (const colorName in tailwindColors) {
  if (deprecatedColors.includes(colorName)) {
    continue;
  }
  const palette = tailwindColors[colorName];
  if (typeof palette === 'object') {
    shades.forEach(shade => {
      if (shade in palette) {
        colorSafeList.push(`bg-${colorName}-${shade}`);
        colorSafeList.push(`text-${colorName}-${shade}`);
        colorSafeList.push(`border-${colorName}-${shade}`);
      }
    });
  }
}

// Add alert specific classes to safelist
const alertClasses = ['alert-error', 'alert-success', 'alert-warning', 'alert-info'];

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './entrypoints/**/*.{js,jsx,ts,tsx,html}'],
  safelist: [...colorSafeList, ...alertClasses],
  theme: {
    extend: {
      colors: tailwindColors,
    },
  },
  plugins: [],
};
