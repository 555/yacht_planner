"use client";

import Image from "next/image";
import Link from "next/link";
import { RenderLink, RenderImage } from "@/devlink/devlinkContext";

export const LinkRenderer: RenderLink = ({
  href,
  className,
  children,
  target,
  preload,
  ...props
}) => (
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

export const ImageRenderer: RenderImage = ({
  src,
  alt,
  height,
  width,
  loading,
  className,
  ...props
}) => {
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