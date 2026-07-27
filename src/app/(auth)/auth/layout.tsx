import "../../globals.css";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <body className="flex grow flex-col">{children}</body>;
}
