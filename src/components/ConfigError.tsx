export default function ConfigError({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-24">
      <h1 className="text-2xl font-bold">This site isn't set up yet</h1>
      <p className="mt-3 text-muted-foreground">{message}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        For whoever deploys it: set <code className="rounded bg-muted px-1.5 py-0.5">VITE_API_URL</code> to the live
        API address (for example <code className="rounded bg-muted px-1.5 py-0.5">https://api.example.com</code>) in the
        host's environment settings, then build and deploy again. The value is baked in at build time.
      </p>
    </div>
  )
}
