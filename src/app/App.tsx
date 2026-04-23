import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';
import { AccessibilityControls } from './components/AccessibilityControls';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
      <AccessibilityControls />
    </>
  );
}
