import { useWindowGroupContext } from '../contexts/WindowGroupContext';
import { useActiveWindowId } from '../contexts/ActiveWindowIdContext';

interface WindowTitleProps {
  windowId: number;
}

const WindowTitle = ({ windowId }: WindowTitleProps) => {
  const { activeWindowId } = useActiveWindowId();
  const { windowGroupNumber } = useWindowGroupContext();
  const title = windowId === activeWindowId ? 'Current Window' : `Window ${windowGroupNumber}`;
  return <h2 className="window-title text-lg font-semibold">{title}</h2>;
};

export default WindowTitle;
