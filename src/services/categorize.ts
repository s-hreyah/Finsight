const API_URL = "http://localhost:5000";
export async function categorizeTransaction(description: string): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/categorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description }),
    });

    const data = await res.json();
    console.log("data category: ", data)
    return data.category || "Other";
  } catch (error) {
    console.error("Categorization error:", error);
    return "Other";
  }
}
export async function categorizeMultipleTransactions(
  descriptions: string[]
): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/categorize-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ descriptions }),
    });

    const data = await res.json();
    return data.categories || descriptions.map(() => "Other");
  } catch (error) {
    console.error("Batch categorization error:", error);
    return descriptions.map(() => "Other");
  }
}