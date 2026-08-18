# Chapter 4: Pharmacy, Inventory & Supply Chain

## 4.1 Overview

The Inventory and Pharmacy Management module ensures critical medications and consumables are always in stock while preventing leakage and managing expiry dates.

## 4.2 Pharmacy Architecture

The system utilizes a multi-store, batch-tracked architecture.

### 4.2.1 Core Inventory Components

| Component | Description | Functionality |
| :--- | :--- | :--- |
| **Master Formulary** | Central drug database. | Categorizes by generic name, brand, schedule (e.g., Narcotics), and formulation. |
| **Batch & Expiry** | Granular tracking. | Enforces FEFO (First Expiry First Out) to minimize wastage and compliance risks. |
| **Indent Management** | Internal requisition system. | Wards and departments request stock from the central medical store. |

## 4.3 Master Drug Formulary Structure

The Master Formulary is the foundational database governing all medication-related activities within the hospital. It categorizes drugs hierarchically to support clinical decision-making (e.g., contraindication checking) and regulatory compliance (e.g., dispensing narcotics).

### 4.3.1 Key Formulary Data Fields

| Data Field | Purpose in Workflow | Example Value |
| :--- | :--- | :--- |
| **Generic Name (Salt)** | Allows doctors to prescribe by generic molecule, and pharmacy to substitute with available brands. | *Paracetamol 500mg* |
| **Brand / Trade Name** | For specific stock keeping and precise dispensing. | *Crocin Advance* |
| **Drug Class & Category** | Drives therapeutic alternatives and allergy warnings in the EMR. | *Analgesic / Antipyretic* |
| **Dosage Form & Route** | Prevents clinical errors (e.g., warning if an IV medication is prescribed as Oral). | *Tablet / Oral* |
| **Regulatory Schedule** | Triggers mandatory dual-authentication (Nurse + Pharmacist) for high-risk drugs. | *Schedule H1 / Narcotic* |
| **Contraindications (Pregnancy/Lactation)** | Integrates with the OPD/IPD modules to alert doctors if prescribing to a pregnant patient. | *Category C* |
| **Reorder Level & Minimum Quantity** | Automates the creation of purchase requisitions before stock-outs occur. | *Reorder at: 500 strips* |

## 4.4 Supply Chain Flow

```mermaid
graph TD
    A[Low Stock Alert] --> B[Generate Purchase Requisition]
    B --> C[Approval Matrix]
    C --> D[Purchase Order to Vendor]
    D --> E[Goods Receipt Note (GRN)]
    E --> F[QA & Barcoding]
    F --> G[Main Medical Store]
    G --> H[Ward Indent / Pharmacy Transfer]
    H --> I[Dispense to Patient]
```
