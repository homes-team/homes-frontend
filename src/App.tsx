import { RouterProvider } from 'react-router-dom';
import { CompareProvider } from './context/CompareContext';
import { router } from './routes';

function App() {
  return (
    <CompareProvider>
      <RouterProvider router={router} />
    </CompareProvider>
  );
}

export default App;
