"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { useBrandLogo } from "@/hooks";
import { LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/seo";
import { useAuth } from "@/contexts";
import { useEffect, useState } from "react";

function Header2() {
  const logoUrl = useBrandLogo();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const updateStickyState = () => {
      setIsSticky(window.scrollY >= 120);
    };

    updateStickyState();
    window.addEventListener("scroll", updateStickyState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateStickyState);
    };
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("query") ?? "").trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
    setIsSidebarOpen(false);
  }

  return (
    <>
    <header
      className={`py-[15px] lg:py-0 xl:py-[10px] fixed top-0 left-0 right-0 z-[4] !rounded-none transition-all duration-300 ease-in-out ${isSticky ? "navbar-sticky" : ""}`}
      id="navbar"
    >
      <div className="container 2xl:!px-[100px] xl:!max-w-[1920px]">
        <div className="relative flex items-center flex-wrap lg:flex-nowrap justify-between lg:justify-start gap-[25px] xl:gap-[35px]">
          <Link
            href="/"
            className="-ml-1 flex shrink-0 items-center gap-2 text-white sm:-ml-2"
            aria-label="BRIXLORE.TV home"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="BRIXLORE.TV"
                width={LOGO_WIDTH}
                height={LOGO_HEIGHT}
                className="h-12 w-auto object-contain"
                unoptimized
              />
            ) : (
              <Image
                src="/logo-2.png"
                alt="BRIXLORE.TV"
                width={LOGO_WIDTH}
                height={LOGO_HEIGHT}
                className="h-9 w-auto object-contain"
                priority
              />
            )}
          </Link>

          <div className="flex-none lg:hidden">
            <button
              type="button"
              id="navbarBurgerToggle"
              aria-label="Open navigation menu"
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen(true)}
              className="navbar-burger-toggle inline-block leading-none"
            >
              <span className="h-[3px] w-[30px] my-[5px] block bg-white" />
              <span className="h-[3px] w-[30px] my-[5px] block bg-white" />
              <span className="h-[3px] w-[30px] my-[5px] block bg-white" />
            </button>
          </div>
          <div className="hidden lg:flex items-center grow basis-full basis-auto gap-[25px] xl:gap-[35px]">
            <ul className="navbar-nav flex items-center flex-row gap-[25px] xl:gap-[35px] flex-none">
              <li className="nav-item relative">
                <Link
                  href="/"
                  className="nav-link active font-bold text-15 relative py-[30px] block text-white transition-all duration-300 ease-in-out hover:text-secondary"
                >
                  Home
                </Link>
              </li>
              <li className="nav-item relative">
                <Link
                  href="/browse-2"
                  className="nav-link font-bold text-15 relative py-[30px] block text-white transition-all duration-300 ease-in-out hover:text-secondary"
                >
                  Movies &amp; TV Shows
                </Link>
              </li>
              <li className="nav-item relative">
                <Link
                  href="/get-the-app"
                  className="nav-link font-bold text-15 relative py-[30px] block text-white transition-all duration-300 ease-in-out hover:text-secondary"
                >
                  Get the App
                </Link>
              </li>
            </ul>
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                name="query"
                className="form-input !h-[50px] rounded-full "
                placeholder="Search for movies or TV shows"
              />
              <button
                className="absolute  top-1/2 ltr:right-[20px] rtl:left-[20px] text-xl leading-none transition-all duration-300 ease-in-out hover:text-primary "
                type="submit"
                style={{ transform: "translateY(-50%)" }}
              >
                <i className="ri-search-line" />
              </button>
            </form>
            <div className="flex items-center gap-[25px] xl:gap-[35px] flex-none">
              {!isLoading && (
                <Link
                  href={isAuthenticated ? "/dashboard" : "/login"}
                  className="text-xl relative inline-block xl:hidden text-white transition-all duration-300 ease-in-out hover:text-secondary"
                >
                  <i className="ri-user-3-line" />
                </Link>
              )}

              {isLoading ? (
                <div className="h-10 w-24 animate-pulse rounded-full bg-white/10" />
              ) : isAuthenticated ? (
                <Link href="/dashboard">
                  <ShimmerButton className="inline-flex items-center justify-center">
                    Dashboard
                  </ShimmerButton>
                </Link>
              ) : (
                <Link href="/login">
                  <ShimmerButton className="inline-flex items-center justify-center">
                    Sign In
                  </ShimmerButton>
                </Link>
              )}
              <button
                type="button"
                id="navbarBurgerToggle"
                aria-label="Open navigation menu"
                aria-expanded={isSidebarOpen}
                onClick={() => setIsSidebarOpen(true)}
                className="navbar-burger-toggle text-xl inline-block text-white transition-all duration-300 ease-in-out hover:text-secondary ltr:-ml-[8px] rtl:-mr-[8px]"
              >
                <i className="ri-menu-line" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
     {/* Sidebar Modal */}
      <div
        className="sidebar-modal"
        style={{
          visibility: isSidebarOpen ? "visible" : "hidden",
          opacity: isSidebarOpen ? 1 : 0,
          translate: isSidebarOpen ? "0 0" : "-100% 0",
        }}
      >
        <div className="p-[20px] md:p-[30px] lg:px-[40px] flex items-center justify-between bg-black border-b border-white/8">
          <Link
            href="/"
            className="-ml-1 flex shrink-0 items-center gap-2 text-white sm:-ml-2"
            aria-label="BRIXLORE.TV home"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="BRIXLORE.TV"
                width={LOGO_WIDTH}
                height={LOGO_HEIGHT}
                className="h-12 w-auto object-contain"
                unoptimized
              />
            ) : (
              <Image
                src="/logo-2.png"
                alt="BRIXLORE.TV"
                width={LOGO_WIDTH}
                height={LOGO_HEIGHT}
                className="h-9 w-auto object-contain"
                priority
              />
            )}
          </Link>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsSidebarOpen(false)}
            className="inline-block text-xl leading-none text-white transition-all duration-300 ease-in-out hover:text-secondary"
          >
            <i className="flaticon-close" />
          </button>
        </div>
        <div
          className="overflow-y-scroll h-screen scrollbar"
          data-lenis-prevent
        >
          <ul className="sidebar-navbar-nav p-[20px] md:p-[30px] lg:px-[40px]">
            <li className="nav-item mb-[20px] last:mb-0">
              <Link
                href="/"
                className="nav-link active font-bold text-15 lg:text-base relative block text-white transition-all duration-300 ease-in-out hover:text-secondary"
              >
                Home
              </Link>
            </li>
            <li className="nav-item mb-[20px] last:mb-0">
              <Link
                href="/browse-2"
                className="nav-link font-bold text-15 lg:text-base relative block text-white transition-all duration-300 ease-in-out hover:text-secondary"
              >
                Movies &amp; TV Shows
              </Link>
            </li>
            <li className="nav-item mb-[20px] last:mb-0">
              <Link
                href="/get-the-app"
                className="nav-link font-bold text-15 lg:text-base relative block text-white transition-all duration-300 ease-in-out hover:text-secondary"
              >
                Get the App
              </Link>
            </li>
            <li className="nav-item mb-[20px] last:mb-0">
              <Link
                href="/about"
                className="nav-link font-bold text-15 relative block text-white transition-all duration-300 ease-in-out hover:text-secondary"
              >
                About Us
              </Link>
            </li>
            <li className="nav-item mb-[20px] last:mb-0">
              <Link
                href="/help-center"
                className="nav-link font-bold text-15 relative block text-white transition-all duration-300 ease-in-out hover:text-secondary"
              >
                Help Center
              </Link>
            </li>
            <li className="nav-item mb-[20px] last:mb-0">
              <Link
                href="/contact"
                className="nav-link font-bold text-15 relative block text-white transition-all duration-300 ease-in-out hover:text-secondary"
              >
                Contact
              </Link>
            </li>
            <li className="nav-item mb-[20px] last:mb-0">
              <Link
                href="/privacy-policy"
                className="nav-link font-bold text-15 relative block text-white transition-all duration-300 ease-in-out hover:text-secondary"
              >
                Privacy Policy
              </Link>
            </li>
            <li className="nav-item mb-[20px] last:mb-0">
              <Link
                href="/terms-of-use"
                className="nav-link font-bold text-15 relative block text-white transition-all duration-300 ease-in-out hover:text-secondary"
              >
                Terms &amp; Conditions
              </Link>
            </li>
          </ul>
        </div>
        <div className="p-[20px] md:p-[30px] lg:px-[40px] bg-black border-t border-white/8 lg:hidden">
          <div className="flex items-center gap-[25px] md:gap-[30px] mb-[20px] md:mb-[25px]">
            {isLoading ? (
                <div className="h-10 w-24 animate-pulse rounded-full bg-white/10" />
              ) : isAuthenticated ? (
                <Link href="/dashboard">
                  <ShimmerButton className="inline-flex items-center justify-center">
                    Dashboard
                  </ShimmerButton>
                </Link>
              ) : (
                <Link href="/login">
                  <ShimmerButton className="inline-flex items-center justify-center">
                    Sign In
                  </ShimmerButton>
                </Link>
              )}
          </div>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              name="query"
              className="form-input rounded-full"
              placeholder="Search for anything"
            />
            <button
              className="absolute top-1/2  ltr:right-[20px] rtl:left-[20px] text-xl leading-none transition-all duration-300 ease-in-out hover:text-primary "
              type="submit"
              style={{ transform: "translateY(-50%)" }}
            >
              <i className="ri-search-line" />
            </button>
          </form>
        </div>
      </div>
      <div
        className="backdrop"
        style={{
          visibility: isSidebarOpen ? "visible" : "hidden",
          opacity: isSidebarOpen ? 0.7 : 0,
        }}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />
      {/* End Sidebar Modal */}</>
  );
}

export default Header2;
