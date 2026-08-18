# Chapter 6: Laboratory & Diagnostics (LIS/RIS)

## 6.1 Overview

A fully integrated Laboratory Information System (LIS) that connects billing to sample collection and reporting.

## 6.2 LIS Workflow

```mermaid
graph LR
    A[Test Ordered & Billed] --> B[Sample Collection (Phlebotomy)]
    B --> C[Barcode Generation & Labeling]
    C --> D[Sample Processing / Machine Interfacing]
    D --> E[Result Entry & Validation]
    E --> F[Pathologist Approval]
    F --> G[Report Dispatched to EMR / Patient Portal]
```
