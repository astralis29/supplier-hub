"use client"

import Image from "next/image"

type Props = {
  name: string
  website?: string
  size?: number
}

function getDomain(website?: string) {
  if (!website) return null

  try {
    if (!website.startsWith("http")) {
      return website
    }

    const url = new URL(website)
    return url.hostname
  } catch {
    return null
  }
}

export default function SupplierLogo({ name, website, size = 32 }: Props) {
  const domain = getDomain(website)

  if (!domain) {
    return (
      <div
        className="flex items-center justify-center bg-gray-200 rounded"
        style={{ width: size, height: size }}
      >
        {name?.[0] || "?"}
      </div>
    )
  }

  const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

  return (
    <Image
      src={favicon}
      alt={name}
      width={size}
      height={size}
      className="rounded object-contain"
    />
  )
}