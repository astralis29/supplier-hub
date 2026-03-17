"use client"

import { useState } from "react"
import SearchBar from "./SearchBar"
import LiveResults from "./LiveResults"

export default function SearchSection({
  countries
}: {
  countries: string[]
}) {

  const [liveQuery, setLiveQuery] = useState("")

  return (
    <>
      <SearchBar
        countries={countries}
        onQueryChange={setLiveQuery}
      />

      <LiveResults query={liveQuery} />
    </>
  )
}