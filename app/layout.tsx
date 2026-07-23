import type { Metadata, Viewport } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Carevo — Know exactly where to go when you\'re sick',
  description: 'AI-powered care navigation: the right level of care, what it costs, and what happens after your visit. Never a medical label.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-slate-900">
        <Nav />
        <div className="pb-20 sm:pb-0">{children}</div>
        <SiteFooter />
        {/* Privacy-preserving presence beacon: a random per-tab id (no cookie,
            no PII) so the admin dashboard can show live viewers + page views. */}
        <script dangerouslySetInnerHTML={{ __html: `
(function(){try{
  var id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  var first = true;
  function ping(){ try{ fetch('/api/beacon',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:id,firstView:first}),keepalive:true}); first=false; }catch(e){} }
  ping(); setInterval(ping, 45000);
  document.addEventListener('visibilitychange', function(){ if(document.visibilityState==='visible') ping(); });
}catch(e){}})();
` }} />
      </body>
    </html>
  )
}
