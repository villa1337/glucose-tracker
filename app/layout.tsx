import './globals.css'

export const metadata = {
  title: 'Control de Glucosa',
  description: 'Seguimiento de glucosa y medicamentos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
