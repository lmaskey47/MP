import { useEffect, useRef, useState } from 'react';
import { NativeModules, Vibration } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import { useWorkspace } from '../context/MobileContext';
import { message } from '../services/workspace';
export function useScanner() {
  const { data, workspace, active } = useWorkspace();
  const device = useCameraDevice('back');
  const [permission, setPermission] = useState(false);
  const [status, setStatus] = useState('Cadrez un QR code ou un code-barres.');
  const last = useRef({ code: '', at: 0 });
  const processing = useRef(false);
  const authorize = async () =>
    setPermission((await Camera.requestCameraPermission()) === 'granted');
  useEffect(() => {
    authorize().catch(e => setStatus(message(e)));
  }, []);
  async function accept(code: string) {
    if (
      processing.current ||
      !code ||
      (last.current.code === code && Date.now() - last.current.at < 1500)
    )
      return;
    processing.current = true;
    last.current = { code, at: Date.now() };
    try {
      const matches = data.items.filter(
        i => i.qrCode === code || i._id === code,
      );
      if (matches.length !== 1)
        throw new Error(
          matches.length
            ? 'Code présent dans plusieurs événements : utilisez la liste des équipements.'
            : 'Code inconnu dans votre secteur.',
        );
      await workspace.enqueue('item', matches[0], 'scanned', {});
      Vibration.vibrate(80);
      NativeModules.ScanFeedback?.beep(true);
      setStatus(matches[0].label + ' : scan enregistré.');
    } catch (e) {
      Vibration.vibrate([0, 80, 50, 80]);
      NativeModules.ScanFeedback?.beep(false);
      setStatus(message(e));
    } finally {
      processing.current = false;
    }
  }
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'ean-8', 'code-128', 'code-39'],
    onCodeScanned: codes => {
      if (codes[0]?.value) accept(codes[0].value);
    },
  });
  return { device, permission, authorize, status, accept, codeScanner, active };
}
