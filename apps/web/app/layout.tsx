export const metadata = { title: 'NextReport Engine', description: 'Modern reporting engine' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
