"use client"
import { useBrandLogo } from "@/hooks";
import { LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import React from "react";

function Footer2() {
  const logoUrl = useBrandLogo();
  return (
    <footer 
    // className="pt-[60px] md:pt-[80px] lg:pt-[100px] xl:pt-[120px] 2xl:pt-[140px]"
    >
           {/* Tepm0roy */}
      {/* <div className="container">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[25px]">
          <div className="col-span-2">
            <Link
              href="/"
              className="-ml-1 flex shrink-0 items-center mb-4 gap-2 text-white sm:-ml-2 "
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
            <p className="text-body/80 xl:max-w-[360px]">
              BRIXLORE is your urban-centric network for uncensored digital
              media, original series, and groundbreaking cinema.
            </p>
            <ul className="text-lg md:text-xl leading-none text-body/80 flex flex-wrap gap-[10px] mt-[20px] md:mt-[25px] lg:mt-[30px]">
              <li>
                <Link
                  href="/get-the-app"
                  className="transition-all duration-300 ease-in-out hover:text-secondary"
                  target="_blank"
                >
                  <i className="ri-apple-fill" />
                </Link>
              </li>
              <li>
                <Link
                  href="/get-the-app"
                  className="transition-all duration-300 ease-in-out hover:text-secondary"
                  target="_blank"
                >
                  <i className="ri-android-fill" />
                </Link>
              </li>

            </ul>
          </div>
          <div className="hidden md:block">
            <h3 className="mb-[20px] md:mb-[25px] lg:mb-[30px] text-base md:text-lg lg:text-xl leading-none">
              Company
            </h3>
            <ul className="text-body/80 font-bold text-13 md:text-sm lg:text-15 ltr:md:border-l rtl:md:border-r md:border-white/10 ltr:md:pl-[20px] rtl:md:pr-[20px]">
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/about"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  About
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/subscription"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Pricing
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/contact"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Contact
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/privacy-policy"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Policies
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/get-the-app"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Shop
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/about"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Testimonials
                </Link>
              </li>
            </ul>
          </div>
       <div className="hidden md:block">
            <h3 className="mb-[20px] md:mb-[25px] lg:mb-[30px] text-base md:text-lg lg:text-xl leading-none">
              Quick Links
            </h3>
            <ul className="text-body/80 font-bold text-13 md:text-sm lg:text-15 ltr:md:border-l rtl:md:border-r md:border-white/10 ltr:md:pl-[20px] rtl:md:pr-[20px]">
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/browse"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Live Streaming
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/browse"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Video Player
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/browse"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Screen Recorder
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/distribute"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Monetization
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/distribute"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Create
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/partners"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Collaboration
                </Link>
              </li>
            </ul>
          </div>
        <div className="hidden md:block">
            <h3 className="mb-[20px] md:mb-[25px] lg:mb-[30px] text-base md:text-lg lg:text-xl leading-none">
              Categories
            </h3>
            <ul className="text-body/80 font-bold text-13 md:text-sm lg:text-15 ltr:md:border-l rtl:md:border-r md:border-white/10 ltr:md:pl-[20px] rtl:md:pr-[20px]">
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/browse"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Gaming
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/browse"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Movies
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/browse"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Sports
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/browse"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Entertainment
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/browse"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  Music
                </Link>
              </li>
              <li className="mb-[13px] md:mb-[15px] last:mb-0">
                <Link
                  href="/browse"
                  className="transition-all ease-in-out duration-300 hover:text-secondary"
                >
                  TV Shows
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div> */}
      {/* <div className="pt-[60px] md:pt-[80px] lg:pt-[100px] xl:pt-[120px] 2xl:pt-[140px]" /> */}
      {/* add to class mb-[85px] */}
      <div className="py-[20px] md:py-[30px] lg:py-[40px] border-t border-white/10  md:mb-0">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px] md:gap-[25px] items-center text-center ltr:md:text-left rtl:md:text-right">
            <p className="flex-none !mb-0 md:text-start text-center">
              © 2025 - 2026 Brixlore. All Rights Reserved
            </p>
            <ul className="text-lg md:text-xl leading-none text-body/80 flex flex-wrap justify-center md:justify-end gap-[10px]">
              <li>
                <Link
                  href="https://www.instagram.com/brixlore.tv/"
                  className="transition-all duration-300 ease-in-out hover:text-secondary"
                  target="_blank"
                >
                  <i className="ri-instagram-line" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.tiktok.com/@brixloretv?_r=1&_t=ZT-94mHGk4okzV"
                  className="transition-all duration-300 ease-in-out hover:text-secondary"
                  target="_blank"
                >
                  <i className="ri-tiktok-fill" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://x.com/Brixlore"
                  className="transition-all duration-300 ease-in-out hover:text-secondary"
                  target="_blank"
                >
                  <i className="ri-twitter-x-line" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.facebook.com/share/18RtyTkRXA/"
                  className="transition-all duration-300 ease-in-out hover:text-secondary"
                  target="_blank"
                >
                  <i className="ri-facebook-fill" />
                </Link>
              </li>

              <li>
                <Link
                  href="https://youtube.com/@brixlore?si=0SyB5xL99PWqSCnW"
                  className="transition-all duration-300 ease-in-out hover:text-secondary"
                  target="_blank"
                >
                  <i className="ri-youtube-fill" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </footer>
  );
}

export default Footer2;
