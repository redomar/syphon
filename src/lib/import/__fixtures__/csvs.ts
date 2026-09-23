/**
 * Synthetic CSVs reproducing the *shapes* of real exports (no real data):
 * an aggregator export (merchant + raw description, categories, 3 accounts,
 * blank merchants, transfer pair, refund, pending row, zero row, in-file repeat,
 * empty "Notes"/"Sub Type" columns) and two simple bank formats.
 */
export const AGGREGATOR = [
  "Date,Merchant Name,Description,Amount,Category,Notes,Account Provider,Account Name,Status,Sub Type",
  "2026-09-21,Uber,UBER   * EATS PENDING,-22.03,Transport,,Lloyds Personal,Lloyds,Pending,",
  "2026-09-21,ASDA,ASDA STORES            Birmingham    GBR,-103.88,Groceries,,Lloyds Personal,Lloyds,,",
  "2026-09-20,Eis Cafe,SQ *EIS CAFE           Birmingham    GBR,-3.90,Eating Out,,Lloyds Personal,Lloyds,,",
  "2026-09-20,Costa Coffee,COSTA COFFEE 43011200  EDGBASTON     GBR,-13.30,Eating Out,,Lloyds Personal,Lloyds,,",
  "2026-09-19,Twitch,TWITCH CD 3020,-4.99,Entertainment,,TSB,TSB,,",
  "2026-09-18,,ACME DESIGN LTD                          INVOICE 473,-60.00,General,,TSB,TSB,,",
  "2026-09-18,,EXAMPLE EMPLOYER LTD                     Final payroll,2500.00,Income,,TSB,TSB,,",
  "2026-09-17,Tesco,TESCO STORES           BIRMINGHAM    GBR,-1.00,Groceries,,Lloyds Personal,Lloyds,,",
  "2026-09-17,Tesco,TESCO STORES           BIRMINGHAM    GBR,-1.00,Groceries,,Lloyds Personal,Lloyds,,",
  "2026-09-16,Amazon,AMAZON* NM5HS9RG4      LONDON        LND,-24.99,Shopping,,Lloyds Personal,Lloyds,,",
  "2026-09-16,Amazon,AMAZON* NM5HS9RG4      LONDON        LND,24.99,Shopping,,Lloyds Personal,Lloyds,,",
  "2026-09-15,TSB,TSB PAY VIA MOBILE,-500.00,Internal Transfers,,Monzo,Monzo,,",
  "2026-09-15,Monzo,MONZO FP 15/09/26 0818,500.00,Internal Transfers,,TSB,TSB,,",
  "2026-09-14,Monzo,Monzo,-0.45,Finances,,Monzo,Monzo,,",
  "2026-09-14,Friend Loan,LOAN REPAY,-50.00,Lending,,Monzo,Monzo,,",
  "2026-09-13,Disney+,Disney+,0,Entertainment,,Monzo,Monzo,,",
  "2026-09-12,Hotel Example,HOTEL EXAMPLE LONDON,-120.00,Hotel ,,Monzo,Monzo,,",
].join("\n");

export const SIMPLE_SPLIT = [
  "Transaction Date,Transaction Description,Debit Amount,Credit Amount,Balance",
  "21/09/2026,SQ *EIS CAFE           Birmingham    GBR,3.90,,1000.00",
  "20/09/2026,COSTA COFFEE 43011169  BIRMINGHAM    GBR,4.10,,1003.90",
  "19/09/2026,EXAMPLE EMPLOYER LTD SALARY,,2500.00,1008.00",
  "18/09/2026,TWITCH CD 3020,4.99,,-1492.00",
  "13/09/2026,OPENAI *CHATGPT SUBSCR SAN FRANCISCO CA,20.00,,-1487.01",
].join("\n");

export const SIMPLE_INDICATOR = [
  "Posted Date,Details,Amount,CR/DR",
  "09/21/2026,AMZNMktplace*TH41C7LT5 LONDON GBR,12.99,DR",
  "09/13/2026,REFUND AMZNMktplace*TH41C7LT5,12.99,CR",
].join("\n");
