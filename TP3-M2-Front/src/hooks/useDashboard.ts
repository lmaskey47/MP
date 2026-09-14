import { useWorkspace } from '../context/MobileContext';
export function useDashboard() {
  const { data } = useWorkspace();
  const stock = Object.entries(
    data.items.reduce<Record<string, number>>((totals, item) => {
      totals[item.status] = (totals[item.status] ?? 0) + 1;
      return totals;
    }, {}),
  );
  const overdue = data.tasks.filter(
    t => t.status !== 'done' && t.dueAt && Date.parse(t.dueAt) < Date.now(),
  );
  const blocked = data.tasks.filter(t => t.status === 'blocked');
  const lateDeliveries = data.deliveries.filter(
    d =>
      !['delivered', 'cancelled'].includes(d.status) &&
      d.stops.some(s => !s.validatedAt && Date.parse(s.plannedAt) < Date.now()),
  );
  return { stock, overdue, blocked, lateDeliveries };
}
