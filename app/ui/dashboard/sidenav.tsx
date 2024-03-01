import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import AcmeLogo from '@/app/ui/acme-logo';
import { PowerIcon } from '@heroicons/react/24/outline';

export default function SideNav() {
  return (
    <div className="flex h-20 w-full items-center justify-between py-4">
      <div className="flex items-center justify-start">
        <Link href="/" className="mr-4 flex h-full items-center justify-center">
          <div className="w-32 md:w-40">
            <AcmeLogo />
          </div>
        </Link>
        <NavLinks />
      </div>
      <form>
        <button className="flex items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600">
          <PowerIcon className="w-6" />
          <span>Sign Out</span>
        </button>
      </form>
    </div>
  );
}
