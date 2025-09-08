interface TabCountBadgeProps {
  count: number;
}

const TabCountBadge = ({ count }: TabCountBadgeProps) => {
  return <div className="badge badge-outline badge-xs badge-primary">{count}</div>;
};

export default TabCountBadge;
