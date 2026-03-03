"use client";

import { useState } from "react";

export default function RegisterSupplier() {
  const [abn, setAbn] = useState("");
  const [verified, setVerified] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [error, setError] = useState("");

  async function verifyABN() {
    setError("");

    try {
      const res = await fetch("/api/verify-abn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abn }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setLegalName(data.legalName);
      setVerified(true);
    } catch (err) {
      setError("Something went wrong");
    }
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>
        Register Supplier
      </h1>

      <input
        style={{
          border: "1px solid black",
          padding: "10px",
          width: "400px",
          marginBottom: "10px",
          display: "block",
        }}
        placeholder="Enter ABN"
        value={abn}
        onChange={(e) => setAbn(e.target.value)}
      />

      <button
        type="button"
        onClick={verifyABN}
        style={{
          backgroundColor: "blue",
          color: "white",
          padding: "10px 20px",
          cursor: "pointer",
        }}
      >
        Verify ABN
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {verified && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            border: "1px solid green",
          }}
        >
          <p>
            <strong>Verified Legal Name:</strong>
          </p>
          <p>{legalName}</p>
        </div>
      )}
    </div>
  );
}