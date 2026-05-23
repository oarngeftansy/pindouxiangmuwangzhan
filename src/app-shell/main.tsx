import { createRoot } from 'react-dom/client';
import { MobileApp } from './MobileApp';
import '../index.css';
import { setupNativeUI } from '../utils/native';

createRoot(document.getElementById('root')!).render(<MobileApp />);

// iOS Capacitor 包装时隐藏 splash + 配状态栏；Web 端 no-op
setupNativeUI();
