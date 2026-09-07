import dotenv from "dotenv";
import { and, eq } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

type DividendRecord = { symbol: string; receivedAt: string; dividendAmount: number; withholdingTax: number };

const records: DividendRecord[] = ([
  ["NVDA", "2024-06-29", .05, 0], ["VST", "2024-06-29", .03, 0], ["O", "2024-07-15", 2.08, .31], ["TGLS", "2024-07-31", .01, 0],
  ["JEPQ", "2024-08-05", 1.31, .19], ["ABBV", "2024-08-16", .89, .13], ["AAPL", "2024-08-16", .02, 0], ["O", "2024-08-16", 2.08, .31],
  ["PFE", "2024-09-03", .81, .12], ["V", "2024-09-03", .03, 0], ["JEPQ", "2024-09-05", 2.22, .33], ["LLY", "2024-09-10", .29, .04],
  ["MSFT", "2024-09-12", .13, .01], ["O", "2024-09-13", 2.08, .31], ["GOOGL", "2024-09-16", .14, .02], ["NEE", "2024-09-16", .15, .02],
  ["MCD", "2024-09-17", .11, .01], ["META", "2024-09-26", .08, .01], ["AVGO", "2024-10-01", .77, .11], ["PEP", "2024-10-01", .14, .02],
  ["HCA", "2024-10-01", .02, 0], ["VST", "2024-10-01", .05, 0], ["NVDA", "2024-10-03", .07, 0], ["JEPQ", "2024-10-03", 2.28, .34],
  ["TSM", "2024-10-09", .35, 0], ["O", "2024-10-15", 2.08, .31], ["TGLS", "2024-11-01", .03, 0], ["JEPQ", "2024-11-05", 3.24, .48],
  ["LOW", "2024-11-06", .07, .01], ["NUE", "2024-11-08", .03, 0], ["AAPL", "2024-11-14", .02, 0], ["ABBV", "2024-11-16", .89, .13],
  ["O", "2024-11-16", 2.08, .31], ["COST", "2024-11-16", .11, .01], ["V", "2024-12-03", .25, .03], ["PFE", "2024-12-04", .81, .12],
  ["JEPQ", "2024-12-04", 3.6, 0], ["LLY", "2024-12-10", .39, .05], ["MSFT", "2024-12-12", .24, .03], ["O", "2024-12-13", 2.21, .33],
  ["CTAS", "2024-12-13", .03, 0], ["GOOGL", "2024-12-17", .26, .03], ["KO", "2024-12-17", .27, .04], ["MCD", "2024-12-17", .25, .03],
  ["NEE", "2024-12-17", .28, .04], ["UNH", "2024-12-17", .19, .02], ["MSTY", "2024-12-21", 9.28, 1.39], ["META", "2024-12-27", .08, .01],
  ["NVDA", "2024-12-27", .08, .01], ["HCA", "2024-12-27", .31, .04], ["LMT", "2024-12-27", .24, .03],
] as [string, string, number, number][]).map(([symbol, receivedAt, dividendAmount, withholdingTax]) => ({ symbol, receivedAt, dividendAmount, withholdingTax }));

const records2025 = `
AVGO,1/1,.86,.12;VST,1/1,.1,.01;JEPQ,3/1,3.68,.55;NVDY,6/1,5.98,.89;PEP,6/1,.28,.04;MRK,9/1,.68,.1;TSM,10/1,.38,0;O,16/1,2.22,.33;MSTY,17/1,6.86,1.02;TSLY,24/1,2.15,.32;
NVDY,1/2,9.15,1.37;TGLS,1/2,.04,0;JEPQ,5/2,5.45,.81;LOW,5/2,.42,.06;NUE,11/2,.16,.02;AAPL,13/2,.25,.03;MSTY,14/2,6.09,.91;O,14/2,2.22,.33;ABBV,14/2,.94,.14;COST,21/2,.16,.02;STLY,21/2,1.74,.26;
NVDY,1/3,17.78,2.66;VST,3/3,.25,.03;JEPQ,6/3,7.76,1.16;CONY,7/3,.6,.09;PFE,7/3,1.57,.23;LLY,10/3,.71,.1;MSFT,14/3,.37,.05;MSTY,15/3,12.43,1.86;CTAS,15/3,.29,.04;O,17/3,2.25,.33;GOOGL,17/3,.28,.04;NEE,17/3,.37,.05;MCD,17/3,.31,.04;UNH,18/3,.33,.04;TSLY,22/3,1.9,.28;META,26/3,.26,.03;LMT,28/3,.48,.07;NVDY,28/3,8.69,1.3;QQQI,28/3,4.11,.61;SPYI,28/3,2.03,.3;PEP,31/3,.33,.04;VST,31/3,.17,.02;AVGO,31/3,1.48,.22;
HCA,1/4,.46,.06;NVDA,2/4,.13,.01;JEPQ,3/4,11.36,1.7;CONY,4/4,1.75,.26;MRK,7/4,.82,.12;WMT,7/4,.47,.07;NVO,8/4,1.24,0;TSM,10/4,1.35,0;MSTY,11/4,12.05,1.8;O,15/4,2.26,.33;TSLY,21/4,5.28,.79;NVDY,25/4,7.43,1.11;QQQI,25/4,10.09,1.51;SPYI,25/4,4.62,.69;TGLS,30/4,.3,0;
CONY,3/5,2.6,.39;JEPQ,6/5,14.95,2.24;SGOV,6/5,.2,.03;LOW,7/5,.61,.09;MSTY,9/5,24.42,3.21;NUE,12/5,.26,.03;AAPL,15/5,.36,.05;ABBV,15/5,.33,.04;O,15/5,1.61,.24;CALM,15/5,10.49,1.57;COST,16/5,.52,.07;TSLY,16/5,6.08,.91;NVDY,23/5,17.95,2.69;QQQI,23/5,13.39,2;SPYI,23/5,6.08,.91;WMT,27/5,.71,.1;CONY,30/5,2.94,.44;
WFC,2/6,.4,.06;V,2/6,.34,.05;JEPQ,4/6,16.15,2.42;SGOV,5/6,.22,.03;MSTY,6/6,13.27,1.99;LLY,11/6,1.36,.2;MSFT,12/6,.62,.09;PFE,13/6,3.46,.51;O,13/6,1.61,.24;CTAS,13/6,.29,.04;TSLY,16/6,3.22,.48;GOOGL,16/6,.44,.06;MCD,16/6,.31,.04;NEE,16/6,.68,.1;UNH,24/6,1.2,.18;META,27/6,.32,.04;QQQI,27/6,13.19,1.97;LMT,27/6,.48,.07;SPYI,27/6,6.56,.98;
VST,1/7,.17,.02;HCA,1/7,.46,.06;PEP,1/7,.87,.13;AVGO,1/7,1.54,.23;JEPQ,3/7,13.83,2.07;NVDA,3/7,.18,.02;SGOV,7/7,.65,.09;MSTY,7/7,11.18,1.67;MRK,8/7,.98,.14;TSM,10/7,1.68,0;QQQI,25/7,13.37,2;SPYI,25/7,6.65,.99;TGLS,31/7,.3,0;
MSTY,1/8,11.93,1.78;JEPQ,5/8,12.42,1.86;LOW,6/8,.88,.13;SGOV,6/8,.75,.11;NUE,12/8,.31,.04;AAPL,15/8,.36,.05;COST,16/8,.52,.07;ABBV,16/8,.93,.13;CALM,20/8,7.06,1.05;SPYI,22/8,6.73,1;QQQI,22/8,13.2,1.98;NVO,26/8,1.76,.26;MSTY,29/8,10.98,1.64;PFE,3/8,3.67,.55;
V,3/9,.45,.06;WMT,3/9,.71,.1;JEPQ,5/9,12.37,1.85;SGOV,5/9,.75,.11;LLY,10/9,1.93,.28;MSFT,11/9,.62,.09;GOOGL,16/9,.44,.06;NEE,16/9,.68,.1;CTAS,16/9,.74,.11;UNH,23/9,1.2,.18;MSTY,26/9,10.97,1.64;QQQI,26/9,13.46,2.01;SPYI,26/9,6.85,1.02;LMT,26/9,.84,.12;META,29/9,.35,.05;
PEP,1/10,.87,.13;AVGO,1/10,1.85,.27;MCK,1/10,.04,0;NVDA,2/10,.23,.03;JEPQ,3/10,12.48,1.87;SGOV,6/10,.72,.1;MRK,7/10,.98,.14;TSM,11/10,1.77,.01;MSTY,17/10,7.07,1.06;QQQI,24/10,9.67,1.45;SPYI,24/10,6.85,1.02;TGLS,31/10,.3,0;
JEPQ,6/11,13.3,1.99;LOW,6/11,.24,.03;SGOV,6/11,.72,.1;NUE,10/11,.31,.04;CALM,13/11,4.13,.61;AAPL,13/11,.05,0;ABBV,15/11,.93,.13;COST,15/11,.65,.09;QQQI,28/11,9.46,1.41;SPYI,28/11,6.78,1.01;
PFE,2/12,3.67,.55;V,2/12,.51,.07;JEPQ,4/12,15.48,2.32;CVX,11/12,.02,0;LLY,11/12,1.93,.28;MSFT,12/12,.68,.1;MMM,13/12,.01,0;CTAS,16/12,1.64,.24;GOOGL,16/12,.44,.06;UNH,16/12,1.56,.23;META,24/12,.95,.14;NVDA,27/12,.23,.03;QQQI,27/12,9.62,1.44`
  .split(";")
  .map((row) => row.trim())
  .filter(Boolean)
  .map((row): DividendRecord => {
    const [symbol, rawDate, rawAmount, rawTax] = row.split(",");
    const [day, month] = rawDate.split("/");
    return { symbol, receivedAt: `2025-${month.padStart(2, "0")}-${day.padStart(2, "0")}`, dividendAmount: Number(rawAmount), withholdingTax: Number(rawTax) };
  });

records.push(...records2025);

const records2026 = `
AVGO,1/1,3.31,.49;WMT,5/1,.53,.07;TSM,9/1,1.83,0;QQQI,24/1,9.54,1.43;SGOV,6/2,7.29,1.09;AAPL,13/2,.57,.08;COST,14/2,.65,.09;ABBV,18/2,.98,.14;ASML,19/2,.41,0;QQQI,21/2,9.21,1.38;
V,3/3,1.18,.17;SGOV,6/3,5.31,.79;LLY,11/3,2.22,.33;MSFT,12/3,2.74,.41;GOOGL,17/3,1.06,.15;QQQI,21/3,9.13,1.37;META,27/3,.95,.15;NDAQ,31/3,1.94,.29;
AMKR,1/4,.25,.03;AVGO,1/4,2.66,.39;NVDA,2/4,.23,.03;SGOV,8/4,1.32,.19;TSM,10/4,1.5,0;QQQI,25/4,9.45,1.41;
JPM,1/5,1.81,.27;ASML,6/5,2.09,.27;SGOV,7/5,1.34,.2;AAPL,15/5,.66,.09;ABBV,16/5,2.73,.4;COST,16/5,.74,.11;QQQI,23/5,9.88,1.48;YMAG,29/5,1.13,.16;
V,2/6,1.18,.17;SGOV,5/6,1.35,.2;YMAG,5/6,1.12,.16;LLY,11/6,3.01,.45;YMAG,12/6,2.01,.3;MSFT,12/6,3.19,.47;GOOGL,16/6,1.57,.23;QQQI,19/6,7.23,1.08;WM,19/6,1.04,.15;YMAG,19/6,2.46,.36;TAXEXEMPT,19/6,52.15,0;YMAG,26/6,2.42,.36;META,26/6,1.08,.16;QQQM,27/6,.18,.02;NVDA,27/6,6.75,1.01;
AVGO,1/7,3,.45;HCA,1/7,.77,.11;YMAG,2/7,2.18,.32;TSM,10/7,3.05,0;YMAG,10/7,2.29,.34;YMAG,17/7,2.32,.34;MU,22/7,.07,.01;YMAG,24/7,2.75,.41;QQQI,25/7,6.98,1.04;YMAG,31/7,2.7,.4;
ASML,6/8,1.41,0;YMAG,7/8,2.87,.43;COST,8/8,1.08,.16;YMAG,13/8,3.36,.5;AAPL,14/8,.66,.09;ABBV,15/8,2.73,.4;YMAG,20/8,3.17,.47;QQQI,21/8,7.17,1.07;FIX,24/8,.41,.06;YMAG,27/8,2.48,.37;
V,1/9,1.18,.17;JSPT,3/9,3.68,.55;YMAG,3/9,2.54,.38;SGOV,4/9,3.86,.57`
  .split(";")
  .map((row) => row.trim())
  .filter(Boolean)
  .map((row): DividendRecord => {
    const [symbol, rawDate, rawAmount, rawTax] = row.split(",");
    const [day, month] = rawDate.split("/");
    return { symbol, receivedAt: `2026-${month.padStart(2, "0")}-${day.padStart(2, "0")}`, dividendAmount: Number(rawAmount), withholdingTax: Number(rawTax) };
  });

records.push(...records2026);

function transactionKey(record: DividendRecord) {
  return `${record.symbol}|${record.receivedAt}|${record.dividendAmount}|${record.withholdingTax}`;
}

async function main() {
  const databaseModule = await import("@/db") as typeof import("@/db") & { default?: typeof import("@/db") };
  const schemaModule = await import("@/db/schema") as typeof import("@/db/schema") & { default?: typeof import("@/db/schema") };
  const { db } = databaseModule.default ?? databaseModule;
  const { assets, dividendTransactions, users } = schemaModule.default ?? schemaModule;
  const [user] = await db.select({ id: users.id }).from(users).limit(1);
  if (!user) throw new Error("No user account was found.");

  const [holdings, existingTransactions] = await Promise.all([
    db.select({ symbol: assets.symbol }).from(assets).where(and(eq(assets.userId, user.id), eq(assets.category, "Stocks"))),
    db.select({ symbol: dividendTransactions.symbol, receivedAt: dividendTransactions.receivedAt, dividendAmount: dividendTransactions.dividendAmount, withholdingTax: dividendTransactions.withholdingTax }).from(dividendTransactions).where(eq(dividendTransactions.userId, user.id)),
  ]);
  const existingSymbols = new Set(holdings.map((holding) => holding.symbol));
  const missingSymbols = [...new Set(records.map((record) => record.symbol))].filter((symbol) => !existingSymbols.has(symbol));

  if (missingSymbols.length > 0) {
    await db.insert(assets).values(missingSymbols.map((symbol) => ({ userId: user.id, symbol, category: "Stocks" as const, units: 1, averagePrice: 0, color: "#c8ff52" })));
  }

  const transactionKeys = new Set(existingTransactions.map((transaction) => transactionKey({ ...transaction, receivedAt: transaction.receivedAt.toISOString().slice(0, 10) })));
  const newTransactions = records.filter((record) => !transactionKeys.has(transactionKey(record)));
  if (newTransactions.length > 0) {
    await db.insert(dividendTransactions).values(newTransactions.map((record) => ({ ...record, userId: user.id, receivedAt: new Date(`${record.receivedAt}T12:00:00`) })));
  }

  console.log(JSON.stringify({ addedHoldings: missingSymbols.length, addedTransactions: newTransactions.length, skippedTransactions: records.length - newTransactions.length }));
}

main();
