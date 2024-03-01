import SideNav from '@/app/ui/dashboard/sidenav';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:overflow-hidden">
      <div className="w-full flex-none px-2 md:px-4">
        <SideNav />
      </div>
      <div className="mx-auto max-w-7xl flex-grow p-6 md:overflow-y-auto md:p-12">
        {children}
      </div>
    </div>
  );
}
