import { notFound } from "next/navigation";

// Rute default /admin sengaja dinonaktifkan untuk keamanan
// Akses admin dipindahkan ke URL rahasia pengelola: /portal-bahtera
export default function AdminForbiddenPage() {
  notFound();
}
