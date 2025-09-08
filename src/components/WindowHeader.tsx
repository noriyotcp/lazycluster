import WindowTitle from './WindowTitle';
import TabCountBadge from './TabCountBadge';
import { useWindowTabCount } from '../hooks/useWindowTabCount';

interface WindowHeaderProps {
  windowId: number;
  activeWindowId: number | null;
}

const WindowHeader = ({ windowId, activeWindowId }: WindowHeaderProps) => {
  const tabCount = useWindowTabCount(windowId);
  
  return (
    <div className="flex items-center gap-4">
      <WindowTitle windowId={windowId} activeWindowId={activeWindowId} />
      <TabCountBadge count={tabCount} />
    </div>
  );
};

export default WindowHeader;
