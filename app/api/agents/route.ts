// Upstash GET returns a JSON object like {"result": "..."}
    // We need to parse the outer JSON, then potentially parse the inner string result
    const data = JSON.parse(raw);
    if (!data.result) {
      console.warn("No result property in Upstash response, falling back.");
      return NextResponse.json(fallback());
    }

    let parsed;
    try {
      // Handle cases where Redis stores JSON strings
      parsed = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
    } catch (parseError) {
      console.error("Failed to parse inner JSON result:", parseError);
      return NextResponse.json(fallback());
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("Redis fetch failed, falling back to static data:", e);
    return NextResponse.json(fallback());
  }
}