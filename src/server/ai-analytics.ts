import { GoogleGenAI } from '@google/genai';
import { db } from './db';

export async function answerStoreQuery(storeId: string, userQuery: string) {
  const store = db.getStoreById(storeId);
  if (!store) {
    throw new Error('Store not found or unauthorized access.');
  }

  // Calculate real factual metrics from the database
  const analytics7Days = db.getStoreAnalytics(storeId, 7);
  const analytics30Days = db.getStoreAnalytics(storeId, 30);
  const analyticsAllTime = db.getStoreAnalytics(storeId, 365);
  const recentOrders = db.getOrders({ storeId }).slice(0, 10);
  const storeProducts = db.getProducts({ storeId });

  // Verified facts payload
  const factualContext = {
    storeName: store.name,
    businessName: store.businessName,
    verificationStatus: store.verificationStatus,
    theme: store.themeId,
    totalCatalogProducts: storeProducts.length,
    analytics_30_days: {
      totalRevenue: `₹${analytics30Days.totalRevenue.toLocaleString('en-IN')}`,
      paidRevenue: `₹${analytics30Days.paidRevenue.toLocaleString('en-IN')}`,
      orderCount: analytics30Days.totalOrdersCount,
      deliveredOrders: analytics30Days.deliveredCount,
      pendingOrProcessingOrders: analytics30Days.pendingCount,
      cancelledOrders: analytics30Days.cancelledCount,
      averageOrderValue: `₹${analytics30Days.averageOrderValue.toLocaleString('en-IN')}`,
      topSellingProducts: analytics30Days.topSellingProducts.map(p => ({
        name: p.name,
        unitsSold: p.quantity,
        revenue: `₹${p.revenue.toLocaleString('en-IN')}`,
      })),
      lowStockProducts: analytics30Days.lowStockProducts.map(p => ({
        name: p.name,
        unitsInStock: p.stock,
        sku: p.sku,
      })),
      slowMovingProducts: analytics30Days.slowMovingProducts.map(p => ({
        name: p.name,
        unitsInStock: p.stock,
        price: `₹${p.price.toLocaleString('en-IN')}`,
      })),
    },
    analytics_7_days: {
      totalRevenue: `₹${analytics7Days.totalRevenue.toLocaleString('en-IN')}`,
      orderCount: analytics7Days.totalOrdersCount,
    },
  };

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are the AI Business Analyst for the store "${store.name}".
CRITICAL SAFETY & TRUTH RULES:
1. NEVER invent, hallucinate, or estimate numbers. You must only cite numbers directly provided in the verified store metrics JSON context below.
2. If data is missing or zero, explicitly say that the data is not available or recorded.
3. Distinguish between total order volume vs paid revenue, and mention whether cancellations occurred.
4. Specify the exact time horizon (e.g. "Over the past 30 days") for any metric mentioned.
5. Provide concise, professional, actionable business recommendations based only on the real data.
6. Provide supporting evidence items (e.g. specific product names and stock counts).`;

      const prompt = `Here is the verified store business data:
${JSON.stringify(factualContext, null, 2)}

Shopkeeper question: "${userQuery}"

Provide a structured, evidence-backed answer.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2, // Low temperature for high factual precision
        },
      });

      return {
        answer: response.text || 'Analysis completed.',
        factualEvidence: factualContext,
        modelUsed: 'gemini-2.5-flash',
      };
    } catch (err: any) {
      console.warn('[AI Analytics] Gemini call failed, falling back to deterministic engine:', err.message);
    }
  }

  // Deterministic rule-based fallback analytics (when API key is missing or offline)
  let fallbackAnswer = '';
  const q = userQuery.toLowerCase();

  if (q.includes('top') || q.includes('best') || q.includes('popular')) {
    if (analytics30Days.topSellingProducts.length > 0) {
      const list = analytics30Days.topSellingProducts
        .map((p, i) => `${i + 1}. **${p.name}** — ${p.quantity} units sold (Revenue: ₹${p.revenue.toLocaleString('en-IN')})`)
        .join('\n');
      fallbackAnswer = `### Top-Selling Products (Past 30 Days)\n\nBased on confirmed non-cancelled orders:\n\n${list}\n\n**Recommendation:** Maintain safety inventory for these flagship products to avoid lost sales.`;
    } else {
      fallbackAnswer = `### Top-Selling Products (Past 30 Days)\n\nNo product sales have been recorded in the past 30 days yet. As new orders come in, they will be ranked here.`;
    }
  } else if (q.includes('stock') || q.includes('inventory') || q.includes('low')) {
    if (analytics30Days.lowStockProducts.length > 0) {
      const list = analytics30Days.lowStockProducts
        .map(p => `• **${p.name}** (${p.sku}): **${p.stock} units remaining**`)
        .join('\n');
      fallbackAnswer = `### Low-Stock Alert (Threshold: $\\le 10$ units)\n\nThe following items require restocking:\n\n${list}\n\n**Action Required:** Create purchase orders or adjust inventory in the Products tab.`;
    } else {
      fallbackAnswer = `### Inventory Health (Past 30 Days)\n\nAll ${storeProducts.length} products in your catalog currently have healthy stock levels exceeding 10 units.`;
    }
  } else if (q.includes('revenue') || q.includes('sales') || q.includes('money') || q.includes('earn')) {
    fallbackAnswer = `### Revenue Overview (Past 30 Days)\n\n• **Total Gross Revenue:** ₹${analytics30Days.totalRevenue.toLocaleString('en-IN')}\n• **Paid Revenue:** ₹${analytics30Days.paidRevenue.toLocaleString('en-IN')}\n• **Total Orders Placed:** ${analytics30Days.totalOrdersCount} orders\n• **Average Order Value (AOV):** ₹${analytics30Days.averageOrderValue.toLocaleString('en-IN')}\n• **Cancelled Orders:** ${analytics30Days.cancelledCount}\n\n*Comparison:* Past 7 days revenue stood at ₹${analytics7Days.totalRevenue.toLocaleString('en-IN')} across ${analytics7Days.totalOrdersCount} orders.`;
  } else if (q.includes('order') || q.includes('ship') || q.includes('pending')) {
    fallbackAnswer = `### Order Fulfillment Status\n\n• **Awaiting Shipment / Processing:** ${analytics30Days.pendingCount} orders\n• **Successfully Delivered:** ${analytics30Days.deliveredCount} orders\n• **Cancelled:** ${analytics30Days.cancelledCount} orders\n\n**Fulfillment Velocity:** Process pending orders quickly to improve customer ratings.`;
  } else if (q.includes('slow') || q.includes('unsold') || q.includes('not sold')) {
    if (analytics30Days.slowMovingProducts.length > 0) {
      const list = analytics30Days.slowMovingProducts
        .map(p => `• **${p.name}** — ₹${p.price.toLocaleString('en-IN')} (${p.stock} units in stock)`)
        .join('\n');
      fallbackAnswer = `### Slow-Moving Inventory (No Sales in 30 Days)\n\n${list}\n\n**Recommendation:** Consider featuring these products on your storefront homepage banner or running a promotional discount.`;
    } else {
      fallbackAnswer = `### Catalog Velocity\n\nAll catalog products have generated sales over the selected 30-day window.`;
    }
  } else {
    fallbackAnswer = `### Executive Summary for ${store.name}\n\n• **30-Day Revenue:** ₹${analytics30Days.totalRevenue.toLocaleString('en-IN')} (${analytics30Days.totalOrdersCount} orders)\n• **Active Products:** ${storeProducts.length} items in catalog\n• **Low Stock Items:** ${analytics30Days.lowStockProducts.length} requiring reorder\n• **Pending Orders:** ${analytics30Days.pendingCount} orders awaiting dispatch\n\nAsk me specific questions like "Which products are low on stock?", "What is my revenue breakdown?", or "Top 5 selling products".`;
  }

  return {
    answer: fallbackAnswer,
    factualEvidence: factualContext,
    modelUsed: 'deterministic-analytics-engine',
  };
}
