import WindowTitle from './WindowTitle';
import TabCountBadge from './TabCountBadge';
import { useWindowTabCount } from '../hooks/useWindowTabCount';

interface WindowHeaderProps {
  windowId: number;
}

const WindowHeader = ({ windowId }: WindowHeaderProps) => {
  const tabCount = useWindowTabCount(windowId);

  return (
    <div className="flex items-center gap-4">
      <WindowTitle windowId={windowId} />
      <TabCountBadge count={tabCount} />
    </div>
  );
};

export default WindowHeader;
