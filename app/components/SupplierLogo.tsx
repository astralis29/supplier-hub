"use client"

import Image from "next/image"

type Props = {
  name: string
  website?: string | null
  size?: number
}

function cleanDomain(input?: string | null) {
  if (!input) return null

  try {
    // Ensure it's a proper URL
    const url = new URL(
      input.startsWith("http") ? input : `https://${input}`
    )

    let host = url.hostname.toLowerCase()

    // remove www.
    host = host.replace(/^www\./, "")

    if (!host.includes(".")) return null

    return host
  } catch {
    return null
  }
}

export default function SupplierLogo({ name, website, size = 32 }: Props) {
  const domain = cleanDomain(website)

  if (!domain) {
    return (
      <div
        className="flex items-center justify-center bg-gray-200 rounded font-semibold text-xs"
        style={{ width: size, height: size }}
      >
        {name?.[0] || "?"}
      </div>
    )
  }

  const favicon = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`

  return (
    <Image
      src={favicon}
      alt={name}
      width={size}
      height={size}
      className="rounded object-contain"
      unoptimized
    />
  )
}