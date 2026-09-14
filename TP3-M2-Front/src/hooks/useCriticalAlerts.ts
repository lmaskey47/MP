import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useWorkspace } from '../context/MobileContext';
export function useCriticalAlerts() {
  const { data, active } = useWorkspace();
  const shown = useRef(new Set<string>());
  useEffect(() => {
    if (!active) return;
    const unseen = data.notifications.filter(
      n => n.critical && !shown.current.has(n._id),
    );
    if (!unseen.length) return;
    unseen.forEach(n => shown.current.add(n._id));
    Alert.alert(
      'Alerte critique',
      unseen.map(n => n.title + ' : ' + n.message).join('\n'),
      [{ text: 'Compris' }],
    );
  }, [data.notifications, active]);
}
