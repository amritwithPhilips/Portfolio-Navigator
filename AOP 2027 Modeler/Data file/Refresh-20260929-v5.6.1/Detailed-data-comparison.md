# AOP2027 v5.6 data comparison

Comparison uses the exact supplied workbooks and the embedded v5.6 baseline. Default scenario results use the unchanged v5.6 engine and its illustrative 100 M€ envelope. No prior browser decisions are applied. Amounts below retain calculation precision in M€.

| Measure | v5.6 embedded | Latest source | Change |
|---|---:|---:|---:|
| Program records | 443.000000 | 464.000000 | +21.000000 |
| Program demand including PMI | 287.053900 | 287.122900 | +0.069000 |
| Base program demand | 281.863900 | 281.932900 | +0.069000 |
| PMI on top | 5.190000 | 5.190000 | +0.000000 |
| Automatic base funding | 99.986000 | 99.984000 | -0.002000 |
| Unfunded base demand | 181.877900 | 181.948900 | +0.071000 |
| Operations services | 167.000000 | 182.000000 | +15.000000 |
| Operations AOP metadata | 469.700000 | 470.314463 | +0.614463 |
| Operations embedded service sum | 469.693000 | 470.314463 | +0.621463 |
| Operations TCO | 469.690000 | 470.314463 | +0.624463 |

## Program changes

Added 21; removed 0; final evidence changes 443; unchanged 0. The original v5.6 fingerprint identified 404 changed and 39 unchanged records. The expanded final-build fingerprint identifies changes in all 443 shared records, including compliance/baseline zero-to-blank and allocation changes. Prior decisions require review. Full field changes and scenario movements are in the accompanying CSV files.

| ID | Program | Old request | New request |
|---|---|---:|---:|
| EW-73 | SPINE24 | 0 | None |
| EW-146 | ISC IT DRP - SAP OneBi & BCS to BDC | 1.5 | 0.3 |
| EW-173 | ISC IT DRP - DESCARTES | 0.9 | None |
| Bu-213 | IR [C1/C2/C3] Channel Partner Program | 0 | None |
| Bu-443 | OneTnV (ProntoForms/TrueContext) Replacement | 1.33 | 0.7 |
| Bu-445 | Decisions Replacement | 0 | 0.1 |
| Bu-400 | (missing) | None | None |
| Bu-401 | (missing) | None | None |
| Bu-402 | (missing) | None | None |
| Bu-403 | (missing) | None | None |
| Bu-404 | (missing) | None | None |
| Bu-405 | (missing) | None | None |
| Bu-406 | (missing) | None | None |
| Bu-407 | (missing) | None | None |
| Bu-408 | (missing) | None | None |
| Bu-449 | SPC Data Re-platforming | None | 0.499 |
| Bu-450 | TrueContext replacement | None | 0.7 |
| Bu-451 | PS Cloud replacement | None | 0.7 |
| Bu-452 | Incenter replacement | None | 0.8 |
| Bu-453 | (missing) | None | None |
| Bu-454 | (missing) | None | None |
| Bu-455 | (missing) | None | None |
| Bu-456 | (missing) | None | None |
| Bu-457 | (missing) | None | None |
| Bu-458 | (missing) | None | None |
| Bu-459 | (missing) | None | None |
| Bu-460 | (missing) | None | None |

## Funding and stage impact

| Priority | Old demand | New demand | Old funded | New funded |
|---|---:|---:|---:|---:|
| Legal and Compliance (Must Do) | 53.136000 | 53.136000 | 43.776000 | 43.776000 |
| Carry Over demand | 107.290900 | 107.518900 | 16.773000 | 16.773000 |
| Sustain Engineering and Hygiene | 36.147000 | 36.147000 | 21.686000 | 21.659000 |
| Value Based Portfolio | 85.290000 | 85.131000 | 17.751000 | 17.776000 |
| IT Simplification | 0.000000 | 0.000000 | 0.000000 | 0.000000 |

## Operations changes

15 services added to the model. 157 shared service costs change at exact precision. The 182-row service-cost sheet includes eight zero-cost services absent from the 174-row allocation bill. Shared costs match exactly. All 36 consuming-organisation allocations reconcile to 470.314463039 M€; the seven recipient TCO clusters reconcile to the same total.

| Service ID | Service | Old M€ | New M€ | Change M€ |
|---|---|---:|---:|---:|
| NEWAI | AI service  | 8.315 | 0.000000000 | -8.315000000 |
| 1007999 | DEX AI Services | None | 8.315000000 | +8.315000000 |
| 1007583 | SE002089 - Special - Digital Productivity and Collaboration | 5.252 | 0.091228438 | -5.160771562 |
| 1008048 | AI Tools - Copilot | None | 4.954525647 | +4.954525647 |
| 1007582 | SE002088 - Standard Collaboration & Workplace Services | 49.058 | 46.266469781 | -2.791530219 |
| 1007698 | SE002181 - Audit Management | 2.735 | 0.087007679 | -2.647992321 |
| 1007702 | SE002185 - CAPA NextGen | 2.906 | 0.445032330 | -2.460967670 |
| 1007573 | SE002096 - Data Center Operations | 4.003 | 1.757269306 | -2.245730694 |
| 1008056 | GenAI Foundation & Services | 2.885 | 4.800307655 | +1.915307655 |
| 1007588 | SE002094 - Specialist Digital Workplace | 6.671 | 8.076522003 | +1.405522003 |
| 1007740 | SE001166 - PIL Philips Voice Cloud | 2.744 | 1.944425309 | -0.799574691 |
| 1007721 | Regulations and Standards Workflow (NCRS) | None | 0.520039588 | +0.520039588 |
| 1007709 | Job Catalog | None | 0.520039588 | +0.520039588 |
| 1007726 | Supplier Quality - SCAR | None | 0.520039588 | +0.520039588 |
| 1007712 | NonConformance | None | 0.520039588 | +0.520039588 |
| 1007720 | QMS Role Selection (Lumen) | None | 0.520039588 | +0.520039588 |
| 1007704 | Customer Feedback Management | None | 0.520039588 | +0.520039588 |
| 1007774 | SE002236 - EADI Insights Ops- Central | 0.538 | 0.073298333 | -0.464701667 |
| 1007627 | SE002145 - Salesforce IGTD | 0.51 | 0.066723526 | -0.443276474 |
| 1007703 | SE002186 - Complaint Handling | 2.138 | 2.552542399 | +0.414542399 |
| 1007849 | Master Data Management | 3.079 | 3.377776880 | +0.298776880 |
| 1007574 | SE002097 - Data Center in a Box | 9.355 | 9.634721325 | +0.279721325 |
| 1007602 | SE002106 - Network Connectivity - Business Critical | 23.491 | 23.750859862 | +0.259859862 |
| 1007589 | SE002095 - Standard Digital Workplace | 22.266 | 22.518271524 | +0.252271524 |
| 1007576 | SE002099 - Azure Cloud Hosting Services | 4.742 | 4.981347183 | +0.239347183 |
| 1007577 | SE002100 - AWS Cloud Hosting Services | 1.221 | 1.428366841 | +0.207366841 |
| 1007575 | SE002098 - Google Cloud Hosting Services | 0.453 | 0.653436288 | +0.200436288 |
| 1007612 | SE002109 - Local Support | 10.039 | 10.164742459 | +0.125742459 |
| 1007773 | SE002235 - O2C Analytics | 4.048 | 4.167498978 | +0.119498978 |
| 1007579 | SE002102 - Mobile Telephony - with Data & Voice Subscription and Standard Corporate-owned Mobile Device (CORP) | 9.822 | 9.939290290 | +0.117290290 |
| 1007780 | SE002242 - Qlik Platform as a Service | 2.889 | 2.985162879 | +0.096162879 |
| 1007769 | SE002231 - One BI | 2.797 | 2.889440401 | +0.092440401 |
| 1007705 | SE002188 - Analytics Operations Support for Real Estate | 0.066 | 0.152398609 | +0.086398609 |
| 1007772 | SE002234 - ITaaP | 2.408 | 2.493913448 | +0.085913448 |
| 1007715 | SE002198 - EasyGenerator - Assima - Learning Platform | 0.119 | 0.204210122 | +0.085210122 |
| 1007713 | SE002196 - Kairos | 0.199 | 0.283554407 | +0.084554407 |
| 1007808 | SE002249 - Calibration Management | 0.171 | 0.255543431 | +0.084543431 |
| 1007719 | SE002202 - PSQ Analytics | 0.236 | 0.320046642 | +0.084046642 |
| 1007727 | SE002210 - Sustainability Application | 0.199 | 0.282808350 | +0.083808350 |
| 1007701 | SE002184 - Business Continuity Management Platform | 0.264 | 0.347221996 | +0.083221996 |
| 1007724 | SE002207 - UDI Registration | 0.278 | 0.361092649 | +0.083092649 |
| 1007722 | SE002205 - Regulatory Information Management (RIMSys) | 0.303 | 0.385693412 | +0.082693412 |
| 1007714 | SE002197 - People AI Agent | 0.358 | 0.439545842 | +0.081545842 |
| 1007708 | SE002191 - Risk and Compliance application for Internal Audit | 0.413 | 0.494314882 | +0.081314882 |
| 1007716 | SE002199 - Talent Acquisition | 0.476 | 0.555930052 | +0.079930052 |
| 1007718 | SE002201 - Process Intelligence | 0.563 | 0.642362444 | +0.079362444 |
| 1007706 | SE002189 - Philips Access Controll System - PACS | 0.812 | 0.887755112 | +0.075755112 |
| 1007700 | SE002183 - Software Validation (NPSS) | 0.841 | 0.916302960 | +0.075302960 |
| 1007723 | SE002206 - Risk and Compliance Applications | 0.894 | 0.967964388 | +0.073964388 |
| 1007711 | SE002194 - Legal Compliance & Operations Applications | 0.989 | 1.061756370 | +0.072756370 |
| 1007776 | SE002238 - Workbench as a Service | 1.557 | 1.625457037 | +0.068457037 |
| 1007771 | SE002233 - EADI Insights Ops- Commercial IT | 1.468 | 1.534669825 | +0.066669825 |
| 1007710 | SE002193 - Learning Management Solution | 1.568 | 1.632657977 | +0.064657977 |
| 1007717 | SE002200 - Philips Process Architecture and Framework Platform | 1.951 | 2.009723548 | +0.058723548 |
| 1007608 | SE002108 - Local Applications | 4.526 | 4.582362457 | +0.056362457 |
| 1007777 | SE002239 - EDI as a service | 0.949 | 1.004832139 | +0.055832139 |
| 1007748 | SE002221 - OLC - archive | 0.042 | 0.092417777 | +0.050417777 |
| 1007755 | SE002228 - GCS Operations | 0.788 | 0.838362812 | +0.050362812 |
| 1007749 | SE002222 - HC Customer Services | 0.29 | 0.340318812 | +0.050318812 |
| 1007747 | SE002220 - B2B ServiceCloud - KCS | 0.007 | 0.057153433 | +0.050153433 |
| 1007741 | SE002214 - HC Whiskey | 0.054 | 0.104146700 | +0.050146700 |
| 1007753 | SE002226 - OneEMS | 0.124 | 0.174122648 | +0.050122648 |
| 1007752 | SE002225 - OneMobile | 0.052 | 0.101884996 | +0.049884996 |
| 1007744 | SE002217 - QLAB Sustain Service | 0.01 | 0.059845889 | +0.049845889 |
| 1007745 | SE002218 - Entitlement Management & Orchestration (EM&O) | 0.264 | 0.313816677 | +0.049816677 |
| 1007742 | SE002215 - License Entitlement Management (LEM) | 1.744 | 1.793730392 | +0.049730392 |
| 1007751 | SE002224 - PIL Education | 0.242 | 0.291725130 | +0.049725130 |
| 1007750 | SE002223 - Planning SPM | 0.655 | 0.704710774 | +0.049710774 |
| 1007746 | SE002219 - Mize Incenter | 1.157 | 1.206699206 | +0.049699206 |
| 1007743 | SE002216 - Professional Services Automation (PSA) | 1.161 | 1.210652106 | +0.049652106 |
| 1007756 | SE002229 - Philips Voice Cloud (HIPAA) | 0.737 | 0.786650525 | +0.049650525 |
| 1007754 | SE002227 - B2B ServiceCloud ServiceMax | 5.318 | 5.367561630 | +0.049561630 |
| 1007707 | SE002190 - Workday - Employee Lifecycle Management Platform | 2.753 | 2.800604937 | +0.047604937 |
| 1007779 | SE002241 - Every Angle for MP1 | 0.314 | 0.357162243 | +0.043162243 |
| 1007778 | SE002240 - Winshuttle | 0.229 | 0.270003959 | +0.041003959 |
| 1007770 | SE002232 - De-identification | 0.189 | 0.229708963 | +0.040708963 |
| 1007850 | Azure Data Lake as a Service  | 9.93 | 9.970187159 | +0.040187159 |
| 1007781 | SE002243 - Power BI Analytics | 0.079 | 0.117615808 | +0.038615808 |
| 1007613 | Local Cloud Hosting Greater China | 2.581 | 2.613655306 | +0.032655306 |
| 1007645 | SE002115 - Requirements, Test & Risk Management | 1.1 | 1.131229142 | +0.031229142 |
| 1007585 | SE002091 - Special - Design Content and Knowledge Tool | 2.749 | 2.780138533 | +0.031138533 |
| 1007674 | SE002163 - Accounting, Reporting & Internal Control | 0.867 | 0.837851842 | -0.029148158 |
| 1007638 | SE002156 - PST | 1.027 | 1.053545819 | +0.026545819 |
| 1007632 | SE002150 - CCRM | 0.248 | 0.274469769 | +0.026469769 |
| 1007644 | SE002162 - Microsoft Dynamics | 0.202 | 0.228422939 | +0.026422939 |
| 1007630 | SE002148 - Anaplan | 2.219 | 2.245333219 | +0.026333219 |
| 1007641 | SE002159 - Zuora | 1.134 | 1.160313364 | +0.026313364 |
| 1007629 | SE002147 - Vistex | 0.67 | 0.696231486 | +0.026231486 |
| 1007636 | SE002154 - SalesForce | 18.804 | 18.830227495 | +0.026227495 |
| 1007633 | SE002151 - Salesforce Appcloud | 0.043 | 0.069166512 | +0.026166512 |
| 1007643 | SE002161 - CIT_AI | 0.262 | 0.288139546 | +0.026139546 |
| 1007639 | SE002157 - ICON | 0.164 | 0.190120623 | +0.026120623 |
| 1007634 | SE002152 - CRM Analytics | 0.079 | 0.104945973 | +0.025945973 |
| 1007635 | SE002153 - QUIP | 0.083 | 0.108942907 | +0.025942907 |
| 1007628 | SE002146 - Seismic | 1.591 | 1.616881477 | +0.025881477 |
| 1007631 | SE002149 - Appcloud | 0.112 | 0.137829561 | +0.025829561 |
| 1007640 | SE002158 - Conga | 9.29 | 9.315747406 | +0.025747406 |
| 1007642 | SE002160 - ServiceNow | 3.401 | 3.426729814 | +0.025729814 |
| 1007637 | SE002155 - Sofon | 1.664 | 1.689660879 | +0.025660879 |
| 1007615 | SE002112 - EMEA R&D Labs & Infra - Local | 1.669 | 1.688651767 | +0.019651767 |
| 1007578 | SE002101 - Network Connectivity - Non-Business Critical | 2.535 | 2.554499588 | +0.019499588 |
| 1007614 | SE002111 - Global R&D Labs & Infra support | 1.597 | 1.615963704 | +0.018963704 |
| 1007725 | SE002208 - ServiceNow - Enterprise Lifecycle Management Platform | 4.846 | 4.863001611 | +0.017001611 |
| 1007581 | SE002104 - Secure Internet (Proxy) | 1.215 | 1.229356812 | +0.014356812 |
| 1007584 | SE002090 - Special - Power Platform | 0.993 | 1.004686650 | +0.011686650 |
| 1007617 | SE002114 - IND R&D Labs & Infra - Local | 0.933 | 0.944296302 | +0.011296302 |
| 1007699 | SE002182 - Automation Platforms | 5.307 | 5.317410736 | +0.010410736 |
| 1007616 | SE002113 - USA R&D Labs & Infra - Local | 0.707 | 0.714753604 | +0.007753604 |
| 1007607 | SE002107 - Secure Internet (VPN) | 0.593 | 0.600215385 | +0.007215385 |
| 1007586 | SE002092 - Special - Business Intelligence & Analytics | 0.623 | 0.630029945 | +0.007029945 |
| 1007580 | SE002103 - Mobile Telephony - with Data & Voice Subscription only. Employees (BYOD) | 0.311 | 0.315141789 | +0.004141789 |
| 1007681 | SE002170 - Deliver - Order Creation & Orchestration | 0.633 | 0.634982742 | +0.001982742 |
| 1007683 | SE002172 - Expense Management | 1.049 | 1.050885411 | +0.001885411 |
| 1007682 | SE002171 - Deliver - Transport Management | 3.241 | 3.242787799 | +0.001787799 |
| 1007679 | SE002168 - Business Core ERP - PH | 3.011 | 3.012747033 | +0.001747033 |
| 1007678 | SE002167 - Business Core ERP - PD | 1.357 | 1.358669871 | +0.001669871 |
| 1007685 | SE002174 - Group Tax | 0.317 | 0.318607249 | +0.001607249 |
| 1007680 | SE002169 - Business Core ERP - SRC | 2.761 | 2.762576025 | +0.001576025 |
| 1007665 | SE002136 - Software Engineering Tools Others | 6.558 | 6.556431144 | -0.001568856 |
| 1007646 | SE002116 - Mobile App development | 0.084 | 0.082440464 | -0.001559536 |
| 1007673 | SE002144 - Events | 0.012 | 0.010441245 | -0.001558755 |
| 1007690 | SE002179 - Planning - PH | 3.749 | 3.750545130 | +0.001545130 |
| 1007649 | SE002119 - Consumer Care | 0.217 | 0.215504620 | -0.001495380 |
| 1007676 | SE002165 - Business Core ERP - HS | 8.583 | 8.584494138 | +0.001494138 |
| 1007687 | SE002176 - Manufacturing | 6.551 | 6.552492148 | +0.001492148 |
| 1007651 | SE002121 - Online Marketing - Social | 0.25 | 0.248518662 | -0.001481338 |
| 1007650 | SE002120 - Online Marketing - CRM PH | 2.125 | 2.123522223 | -0.001477777 |
| 1007668 | SE002139 - Portfolio Investment Management | 4.112 | 4.110556741 | -0.001443259 |
| 1007802 | SE002245 - Business Core ERP - PD (CC) | 1.295 | 1.296407588 | +0.001407588 |
| 1007654 | SE002124 - Digital Services | 2.838 | 2.836650678 | -0.001349322 |
| 1007653 | SE002123 - Online Marketing - Mobile Apps | 0.15 | 0.148679745 | -0.001320255 |
| 1007803 | Business Document Services | 0.616 | 0.617289672 | +0.001289672 |
| 1007664 | SE002135 - CfLM - Configit | 1.088 | 1.086733568 | -0.001266432 |
| 1007655 | SE002125 - Online Marketing - Website | 5.154 | 5.152805568 | -0.001194432 |
| 1007667 | SE002138 - Complaints & Defect Management | 0.038 | 0.036841016 | -0.001158984 |
| 1007661 | SE002132 - Intellectual Property & Experience Design | 0.424 | 0.422852770 | -0.001147230 |
| 1007844 | SE002131 - Intellectual Property Tools | 0.0 | -0.001123585 | -0.001123585 |
| 1007684 | SE002173 - Financial Planning & Analysis | 2.019 | 2.020108833 | +0.001108833 |
| 1007677 | SE002166 - Business Core ERP - Monitoring | 1.654 | 1.655097334 | +0.001097334 |
| 1007675 | SE002164 - Accounting, Reporting & Internal Control (BCS) | 3.117 | 3.118082034 | +0.001082034 |
| 1007689 | SE002178 - Planning - HS | 3.593 | 3.594072178 | +0.001072178 |
| 1007688 | SE002177 - Philips Trade Compliance | 0.964 | 0.965061510 | +0.001061510 |
| 1007660 | SE002130 - Experience Design | 0.839 | 0.837952152 | -0.001047848 |
| 1007686 | SE002175 - Group Treasury | 1.351 | 1.352034893 | +0.001034893 |
| 1007656 | SE002126 - Online Marketing - Channel Partner | 0.046 | 0.045000870 | -0.000999130 |
| 1007691 | SE002180 - Procurement | 4.126 | 4.126999074 | +0.000999074 |
| 1007666 | SE002137 - Software Engineering Tools GitHub-ADS | 3.633 | 3.632001953 | -0.000998047 |
| 1007657 | SE002127 - Online Marketing - Ecommerce | 2.637 | 2.636012855 | -0.000987145 |
| 1007648 | SE002118 - Online Marketing - CRM HS | 0.596 | 0.595074902 | -0.000925098 |
| 1007671 | SE002142 - Claims Management Tools | 0.258 | 0.257158568 | -0.000841432 |
| 1007647 | SE002117 - Marketing & Sales Content | 1.985 | 1.984169904 | -0.000830096 |
| 1007663 | SE002134 - PLM - Windchill | 6.118 | 6.117182650 | -0.000817350 |
| 1007670 | SE002141 - Claims & Evidence Management | 1.139 | 1.138189105 | -0.000810895 |
| 1007658 | SE002128 - Online Marketing - Subscriptions | 0.646 | 0.645290037 | -0.000709963 |
| 1007669 | SE002140 - Clinical Study Management & execution | 2.905 | 2.904300625 | -0.000699375 |
| 1007672 | SE002143 - Online Marketing - Ratings & Reviews | 1.646 | 1.645303507 | -0.000696493 |
| 1007662 | SE002133 - Content Management - ST4 | 0.281 | 0.280342201 | -0.000657799 |
| 1007652 | SE002122 - Online Marketing - Analytics | 1.309 | 1.308347067 | -0.000652933 |
| 1007659 | SE002129 - Hardware Engineering Tools | 12.272 | 12.271416488 | -0.000583512 |
| 1007864 | Regions IT | 15.969 | 15.968510908 | -0.000489092 |
| 1008055 | IGTS GenAI Bot Services | 0.051 | 0.050565379 | -0.000434621 |
| 1007863 | IT Security  | 10.497 | 10.497295769 | +0.000295769 |
| 1008052 | AI Tools - Microsoft Co-work | 0.461 | 0.460750445 | -0.000249555 |
| 1008049 | AI Tools - Copilot Studio | 0.461 | 0.460750445 | -0.000249555 |
| 1007865 | Central Departments (CIO, Portfolio, Vendor & SAM) | 8.894 | 8.893754671 | -0.000245329 |
| 1008037 | CDP Inhouse Operations | 0.3 | 0.300000000 | +0.000000000 |
| 1008036 | GSE Operations | 0.02 | 0.020000000 | +0.000000000 |
| 1008035 | SRC Operations | 0.5 | 0.500000000 | +0.000000000 |
| 1008033 | Service KM AI Search | 3.094 | 3.094000000 | +0.000000000 |
| 1007997 | CS Portal 1.0 | 0.75 | 0.750000000 | +0.000000000 |
| 1008014 | Account Intelligence | None | 0.000000000 | +0.000000000 |
| 1008032 | Online Marketing – Website HS | None | 0.000000000 | +0.000000000 |
| 1008031 | Online Marketing – Ecommerce HS | None | 0.000000000 | +0.000000000 |
| 1007775 | Everest Services | None | 0.000000000 | +0.000000000 |
| 1008029 | SE002317 - Data Quality | 0.326 | 0.326000000 | +0.000000000 |
| 1007804 | SE002247 - DACH R&D Labs & Infra - Local | 0.0 | 0.000000000 | +0.000000000 |
| 1007587 | Special - GitHub Enterprise | None | 0.000000000 | +0.000000000 |
| 1008054 | Digital AI Solutions | None | 0.000000000 | +0.000000000 |
| 1008053 | AI Tools - Amazon Q | None | 0.000000000 | +0.000000000 |
| 1008051 | AI Tools - Claude | 3.4 | 3.400000000 | +0.000000000 |
| 1008050 | AI Tools - ChatGPT | 3.4 | 3.400000000 | +0.000000000 |
| B69NEW2 | Transfer in New services | 12.9 | 12.900000000 | +0.000000000 |

## Gaps requiring meeting attention

- 20 program records have no requested amount. They remain visible and are not converted to zero.
- 133 records have no numeric benefit; 127 exceed 5x submitted lifetime benefit/request. These are source claims, not validated annual savings.
- The latest program source has no Enterprise-wide charging row. F&R allocation to BU clusters must remain explicitly unallocated until Finance supplies a charging key. A previous key must not be silently reused.
- Current policy documents differ from actual v5.6 defaults/classification in several places. The refresh preserves the user-selected engine. Owner confirmation of the meeting rule baseline remains required.
- The 100 M€ budget is illustrative. Funding approval, benefit validation, mandatory-obligation evidence and Finance/Planisware handoff are business decisions, not technical QA passes.

## Source hashes

- Programs: `f3d2dd19319d6143b75f4efaf133f7445e56a6081409e9a3256ddb23d65b3691`
- Operations: `176a6192da3356bcedd9f2babc8318c45977e7658d03172f9e2cb643d22e4668`

## Additional comparison detail

| Measure | v5.6 embedded | Latest source |
|---|---:|---:|
| Numeric benefit coverage | 432 | 331 |
| Missing request | 0 | 20 |
| Blank Decision Band | 80 | 89 |
| Valid HEALTHY/CONTAIN band | 359 | 371 |
| Hard submitted lifetime benefits M€ | 7015.205 | 7056.588 |
| Soft submitted lifetime benefits M€ | 7781.235 | 7823.312 |

Default funding changes are data-driven. The default base allocation falls by 0.002 M€ despite a 0.069 M€ increase in total submitted demand. Four new named requests and 17 placeholder IDs are added; no stable ID is removed. Final migration preview: 21 additions, 443 shared records with evidence changes, 0 removed and 0 unchanged. Within the 39 additional changes detected by expanded fingerprints, 34 records change compliance name/year, 29 change baseline and 15 change allocation fields (categories overlap; many are zero-to-blank changes). This does not imply that funding changes on all 443 records.

All record field changes are in Program-field-changes.csv. Source-cell-changes.csv contains 40,449 raw-field differences, including source header/schema movement; these are not 40,449 changed programs. Program-funding-changes.csv lists all 124 added or changed scenario outcomes. Operations-service-changes.csv lists every service.

Operations changes at exact precision: 15 added services, 157 changed shared values (including rounding differences), 10 identical shared values. The earlier 130-difference finding used a 0.0011 M€ tolerance. All current service values now equal the supplied workbook exactly.

The Operations source contains 182 service cost rows and 174 allocated service rows. Eight additional service IDs have zero 2027 cost and no corresponding allocation row; these are preserved. The consuming-organisation charges, seven TCO clusters, and service costs all reconcile.

See QA-report.html for final checks, corrected defects and meeting gaps.