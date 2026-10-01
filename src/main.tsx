import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import ConfigError from '@/components/ConfigError'
import { apiConfigProblem } from '@/lib/config'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

const configProblem = apiConfigProblem()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {configProblem ? (
      <ConfigError message={configProblem} />
    ) : (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    )}
  </StrictMode>,
)