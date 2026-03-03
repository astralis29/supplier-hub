// lib/taxonomy.ts

// ===============================
// TYPES
// ===============================

export type CapabilityCategory = {
  id: string
  label: string
  keywords: string[]
}

export type Industry = {
  id: string
  label: string
  capabilities: CapabilityCategory[]
}

// ===============================
// STRUCTURED TAXONOMY
// ===============================

export const INDUSTRY_TAXONOMY: Industry[] = [
  {
    id: "mining",
    label: "Mining",
    capabilities: [
      {
        id: "heavy-fabrication",
        label: "Heavy Fabrication",
        keywords: [
          "structural steel",
          "plate work",
          "pressure vessels",
          "heavy engineering",
          "steel fabrication",
          "large fabrication"
        ]
      },
      {
        id: "cnc-machining",
        label: "CNC Machining",
        keywords: [
          "cnc",
          "precision machining",
          "lathe",
          "milling",
          "turning",
          "metal machining"
        ]
      },
      {
        id: "pump-servicing",
        label: "Pump Servicing",
        keywords: [
          "pump overhaul",
          "pump repair",
          "centrifugal pump",
          "slurry pump",
          "pump maintenance"
        ]
      },
      {
        id: "conveyor-systems",
        label: "Conveyor Systems",
        keywords: [
          "conveyor",
          "belt system",
          "material handling",
          "bulk handling",
          "conveyor rollers"
        ]
      }
    ]
  },

  {
    id: "manufacturing",
    label: "Manufacturing",
    capabilities: [
      {
        id: "metal-fabrication",
        label: "Metal Fabrication",
        keywords: [
          "fabrication",
          "welding",
          "steel works",
          "custom metal",
          "sheet metal"
        ]
      },
      {
        id: "assembly",
        label: "Assembly Services",
        keywords: [
          "assembly",
          "production line",
          "contract manufacturing",
          "component assembly"
        ]
      }
    ]
  }
]

// ===============================
// MATCHING ENGINE
// ===============================

export function matchCapabilities(text: string) {
  const lowerText = text.toLowerCase()

  const results: {
    industry: string
    capability: string
  }[] = []

  for (const industry of INDUSTRY_TAXONOMY) {
    for (const capability of industry.capabilities) {
      const matched = capability.keywords.some(keyword =>
        lowerText.includes(keyword.toLowerCase())
      )

      if (matched) {
        // Prevent duplicates
        const alreadyAdded = results.some(
          r =>
            r.industry === industry.label &&
            r.capability === capability.label
        )

        if (!alreadyAdded) {
          results.push({
            industry: industry.label,
            capability: capability.label
          })
        }
      }
    }
  }

  return results
}