"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

// DevLink types - fallback if DevLink isn't available
type RenderLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  target?: "_self" | "_blank";
  preload?: "none" | "prefetch" | "prerender";
  [key: string]: any;
};

type RenderImageProps = {
  src: string | any;
  alt?: string;
  height?: number | string;
  width?: number | string;
  loading?: "lazy" | "eager";
  className?: string;
  [key: string]: any;
};

export const LinkRenderer = ({
  href,
  className,
  children,
  target,
  preload,
  ...props
}: RenderLinkProps) => (
  <Link 
    href={href} 
    className={className} 
    target={target}
    prefetch={preload !== "none" ? true : false}
    {...props}
  >
    {children}
  </Link>
);

export const ImageRenderer = ({
  src,
  alt,
  height,
  width,
  loading,
  className,
  ...props
}: RenderImageProps) => {
  const imgProps = {
    loading,
    className,
    src: typeof src === "string" ? src : "",
    alt: alt || "",
    width: width === "auto" || !width ? undefined : (width as number),
    height: height === "auto" || !height ? undefined : (height as number),
    // Note: this will fill the image to its parent element container
    // so you'll need to style the parent container with the desired size.
    fill: width === "auto" || height === "auto" || (!width && !height),
    ...props,
  };

  return <Image {...imgProps} />;
};