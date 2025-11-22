/**
 * AI Query Feature Test Suite
 * Tests multiple query scenarios and validates responses
 */

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImNvbXBhbnlJZCI6MSwiZW1haWwiOiJvcmlnaW4uZW1pQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTc2MzYwMDA3NiwiZXhwIjoxNzY0MjA0ODc2fQ.xBiUu1KcWYA2877swG2Xi4XIXqdQHR-zlkmL9pTmrgg";
const baseUrl = "http://localhost:3000";

const testCases = [
  {
    name: "Test 1: Maintenance Query (عايز كل الصيانات)",
    query: "عايز كل الصيانات",
    expectedType: "maintenance",
    endpoint: "/api/ai-query/query",
  },
  {
    name: "Test 2: Customers Query (هات العملاء)",
    query: "هات العملاء",
    expectedType: "customers",
    endpoint: "/api/ai-query/query",
  },
  {
    name: "Test 3: Products Query (المنتجات)",
    query: "المنتجات كلها",
    expectedType: "products",
    endpoint: "/api/ai-query/query",
  },
  {
    name: "Test 4: Employees Query (الموظفين)",
    query: "اعرض الموظفين",
    expectedType: "employees",
    endpoint: "/api/ai-query/query",
  },
  {
    name: "Test 5: Invoices Query (الفواتير)",
    query: "الفواتير بتاعتي",
    expectedType: "invoices",
    endpoint: "/api/ai-query/query",
  },
  {
    name: "Test 6: Get History",
    endpoint: "/api/ai-query/history",
    isHistory: true,
  },
  {
    name: "Test 7: Get Suggestions",
    endpoint: "/api/ai-query/suggestions",
    isSuggestions: true,
  },
];

async function runTest(testCase) {
  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📝 ${testCase.name}`);
    console.log(`${"=".repeat(60)}`);

    let options = {
      method: testCase.isHistory || testCase.isSuggestions ? "GET" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    if (testCase.query) {
      options.body = JSON.stringify({ query: testCase.query });
      console.log(`Query: "${testCase.query}"`);
    }

    const response = await fetch(`${baseUrl}${testCase.endpoint}`, options);
    const data = await response.json();

    console.log(`Status: ${response.status}`);

    if (!response.ok) {
      console.error("❌ FAILED");
      console.error("Error:", data.error || data);
      return { passed: false, error: data.error };
    }

    // Validate response structure
    if (data.data) {
      console.log(`✅ Success`);

      if (testCase.isHistory) {
        console.log(`History Count: ${data.count}`);
        if (data.data.length > 0) {
          console.log(`Latest Query: "${data.data[0].queryText}"`);
        }
      } else if (testCase.isSuggestions) {
        console.log(`Suggestions Count: ${data.data.length}`);
        if (data.data.length > 0) {
          console.log(`First Suggestion: "${data.data[0]}"`);
        }
      } else {
        // Query result
        console.log(`Query Type: ${data.data.queryType}`);
        console.log(`Results Count: ${data.data.count}`);
        console.log(`AI Answer: ${data.data.aiAnswer}`);
        if (data.data.embeddingError) {
          console.log(`⚠️  Embedding Status: ${data.data.embeddingError}`);
        }

        if (data.data.results && data.data.results.length > 0) {
          console.log(`\nFirst Result Sample:`);
          const firstResult = data.data.results[0];
          const keys = Object.keys(firstResult).slice(0, 3);
          keys.forEach((key) => {
            console.log(`  ${key}: ${firstResult[key]}`);
          });
        }
      }

      return { passed: true, data };
    } else {
      console.error("❌ Invalid response structure");
      console.log("Response:", JSON.stringify(data, null, 2).substring(0, 500));
      return { passed: false, error: "Invalid response" };
    }
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    return { passed: false, error: error.message };
  }
}

async function runAllTests() {
  console.log(
    "\n" + "🚀 AI Query Feature - Comprehensive Test Suite".padEnd(60, "=")
  );
  console.log(`Starting tests at: ${new Date().toLocaleString()}\n`);

  const results = [];

  // Wait for server to be ready
  console.log("⏳ Waiting for server to be ready...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push({ name: testCase.name, ...result });

    // Add delay between tests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach((r) => {
    const status = r.passed ? "✅" : "❌";
    console.log(`${status} ${r.name}`);
  });

  console.log(
    `\n📈 Results: ${passed} passed, ${failed} failed out of ${results.length} tests`
  );
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
