import { TabGroupColor } from '../types/tabGroup';

// Map Chrome Tab Group colors to Tailwind CSS border-left-color classes
// Uses switch statement to enable Tailwind's static analysis for class detection
export const getTabGroupBorderColorClass = (color: TabGroupColor): string => {
  switch (color) {
    case 'grey':
      return 'border-l-gray-500';
    case 'blue':
      return 'border-l-blue-500';
    case 'red':
      return 'border-l-red-500';
    case 'yellow':
      return 'border-l-yellow-500';
    case 'green':
      return 'border-l-green-500';
    case 'pink':
      return 'border-l-pink-500';
    case 'purple':
      return 'border-l-purple-500';
    case 'cyan':
      return 'border-l-cyan-500';
    case 'orange':
      return 'border-l-orange-500';
    default:
      return 'border-l-transparent';
  }
};
