import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { abn } = body;

    if (!abn) {
      return NextResponse.json(
        { error: "ABN is required" },
        { status: 400 }
      );
    }

    const guid = process.env.ABR_GUID;

    if (!guid) {
      return NextResponse.json(
        { error: "ABR GUID not configured" },
        { status: 500 }
      );
    }

    const url = `https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/SearchByABNv202001?searchString=${abn}&includeHistoricalDetails=N&authenticationGuid=${guid}`;

    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to contact ABR service" },
        { status: 500 }
      );
    }

    const xmlText = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
    });

    const jsonData = parser.parse(xmlText);

    const business =
      jsonData?.['soap:Envelope']?.['soap:Body']?.SearchByABNv202001Response
        ?.SearchByABNv202001Result;

    if (!business || !business.ABN) {
      return NextResponse.json(
        { valid: false, message: "Invalid ABN" }
      );
    }

    return NextResponse.json({
      valid: business.ABN?.ABNStatus === "Active",
      abn: business.ABN?.IdentifierValue,
      entityName:
        business.MainName?.OrganisationName ||
        business.MainName?.IndividualName,
      entityType: business.EntityType?.EntityDescription,
      gstRegistered: business.GoodsAndServicesTax === "true",
    });

  } catch (error) {
    console.error("ABN verification error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}