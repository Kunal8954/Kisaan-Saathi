"""Authoritative dataset of Government of India Agricultural Schemes.

Verified against official guidelines:
- Pradhan Mantri Fasal Bima Yojana (pmfby.gov.in)
- PM-KISAN (pmkisan.gov.in)
- Kisan Credit Card Scheme (rbi.org.in / nabard.org)
- Soil Health Card Scheme (soilhealth.dac.gov.in)
- Pradhan Mantri Krishi Sinchayee Yojana (pmksy.gov.in)
- Sub-Mission on Agricultural Mechanization (agrimachinery.nic.in)
"""

from __future__ import annotations

from app.models.scheme import GovernmentScheme

VERIFIED_SCHEMES: list[GovernmentScheme] = [
    GovernmentScheme(
        id="pmfby",
        name_hi="प्रधानमंत्री फसल बीमा योजना (PMFBY)",
        name_en="Pradhan Mantri Fasal Bima Yojana",
        category="insurance",
        tagline_hi="प्राकृतिक आपदा, कीट व बेमौसम बारिश से फसल नुकसान पर पूर्ण सुरक्षा",
        tagline_en="Comprehensive insurance coverage against non-preventable natural risks",
        description_hi=(
            "PMFBY भारत सरकार की प्रमुख फसल बीमा योजना है जो बुवाई से लेकर कटाई के 14 दिन "
            "बाद तक प्राकृतिक आपदाओं, कीटों, सूखा, ओलावृष्टि और बेमौसम बारिश से नुकसान की "
            "भरपाई करती है।"
        ),
        description_en=(
            "PMFBY provides comprehensive crop insurance from pre-sowing to post-harvest "
            "losses against non-preventable natural risks including weather calamities and pests."
        ),
        benefits_hi=[
            "खरीफ फसलों के लिए मात्र 2% और रबी फसलों के लिए केवल 1.5% प्रीमियम।",
            "वार्षिक वाणिज्यिक व बागवानी फसलों के लिए मात्र 5% प्रीमियम।",
            "बाकी 95% से 98% प्रीमियम केंद्र और राज्य सरकार मिलकर वहन करती हैं।",
            "कटाई के बाद खेत में सूखने के लिए रखी फसल को बारिश से नुकसान पर 14 दिन का कवरेज।",
            "स्थानीय आपदा (ओलावृष्टि, जलभराव, बादल फटना) में व्यक्तिगत खेत स्तर पर नुकसान का आकलन।",
        ],
        benefits_en=[
            "Uniform maximum premium of only 2% for Kharif and 1.5% for Rabi crops.",
            "Maximum 5% premium for commercial and horticultural crops.",
            "Balance premium is heavily subsidized by Central and State Governments.",
            "Post-harvest loss coverage up to 14 days for crops kept in cut-and-spread condition.",
            "Localized calamity assessment (hailstorm, inundation) at individual farm level.",
        ],
        eligibility_criteria_hi=[
            "सभी किसान (बटाईदार व काश्तकार सहित) जो अधिसूचित क्षेत्रों में अधिसूचित फसल उगाते हैं।",
            "ऋणी और गैर-ऋणी दोनों प्रकार के किसानों के लिए स्वैच्छिक व उपलब्ध।",
            "अधिसूचित कट-ऑफ तिथि से पहले बीमा प्रीमियम जमा होना आवश्यक है।",
        ],
        eligibility_criteria_en=[
            "All farmers including tenant farmers growing notified crops in notified areas.",
            "Voluntary for both loanee and non-loanee farmers.",
            "Premium must be deposited before the seasonal cut-off deadline.",
        ],
        required_documents_hi=[
            "आधार कार्ड (Aadhaar Card)",
            "जमीन के दस्तावेज (खसरा/खतौनी की नकल / Land Record)",
            "बैंक पासबुक की प्रति (Aadhaar से लिंक बैंक खाता)",
            "बुवाई प्रमाण पत्र / पटवारी रिपोर्ट (Sowing Certificate)",
            "किरायेदार/बटाईदार होने पर शपथ पत्र या अनुबंध पत्र",
        ],
        required_documents_en=[
            "Aadhaar Card",
            "Land ownership records (RoR / Khasra-Khatauni)",
            "Bank passbook copy with active IFSC",
            "Sowing certificate issued by village revenue officer",
            "Lease agreement or self-declaration for tenant farmers",
        ],
        official_portal="https://pmfby.gov.in",
        helpline="14447 (टोल-फ्री किसान हेल्पलाइन)",
        claim_steps_hi=[
            "नुकसान होने के 72 घंटे के भीतर सूचना देना अनिवार्य है।",
            "क्रॉप इंश्योरेंस ऐप (Crop Insurance App) से सीधे फोटो सहित दावा दर्ज करें, या 14447 पर कॉल करें।",
            "अपनी बैंक शाखा, नजदीकी कृषि अधिकारी या जन सेवा केंद्र (CSC) में लिखित सूचना दें।",
            "सूचना के 48 घंटे में बीमा कंपनी सर्वेक्षक नियुक्त करती है और 10 दिन में सर्वे पूरा होता है।",
            "सर्वे रिपोर्ट के 21 दिनों के भीतर दावा राशि सीधे किसान के बैंक खाते (DBT) में आ जाती है।",
        ],
        claim_steps_en=[
            "Intimation is mandatory within 72 hours of localized crop loss.",
            "Report loss directly via the official Crop Insurance App with photos or call 14447.",
            "Alternatively, submit a written intimation to the bank branch or agriculture officer.",
            "Loss assessment survey is conducted within 10 days of intimation.",
            "Claim compensation is disbursed directly to the bank account via DBT within 21 days.",
        ],
    ),
    GovernmentScheme(
        id="pm-kisan",
        name_hi="प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)",
        name_en="Pradhan Mantri Kisan Samman Nidhi",
        category="income_support",
        tagline_hi="सभी पात्र किसान परिवारों को प्रति वर्ष ₹6,000 की प्रत्यक्ष आर्थिक सहायता",
        tagline_en="Direct income support of ₹6,000 per year to eligible farmer families",
        description_hi=(
            "PM-KISAN योजना के अंतर्गत देश के सभी पात्र भूमिधारक किसान परिवारों को ₹6,000 "
            "प्रति वर्ष की प्रत्यक्ष आर्थिक सहायता सीधे बैंक खाते में (DBT) तीन समान किस्तों में दी जाती है।"
        ),
        description_en=(
            "PM-KISAN provides guaranteed direct income support of ₹6,000 annually in three "
            "equal installments of ₹2,000 directly transferred into Aadhaar-linked bank accounts."
        ),
        benefits_hi=[
            "प्रति वर्ष ₹6,000 की सुनिश्चित आय सहायता (हर 4 महीने में ₹2,000 की किस्त)।",
            "राशि सीधे आधार लिंक बैंक खाते में (DBT) बिना किसी बिचौलिए के ट्रांसफर।",
            "बीज, खाद, कीटनाशक व अन्य कृषि इनपुट खरीदने के लिए तुरंत वित्तीय सहारा।",
        ],
        benefits_en=[
            "Guaranteed ₹6,000 annual income support transferred in 3 equal installments.",
            "100% centrally sponsored with direct benefit transfer (DBT) into bank accounts.",
            "Timely financial liquidity to purchase seeds, fertilizers, and farm inputs.",
        ],
        eligibility_criteria_hi=[
            "सभी भूमिधारक किसान परिवार जिनके नाम पर कृषि योग्य भूमि दर्ज है।",
            "संवैधानिक पदधारक, आयकर दाता (Income Tax Payers), और सरकारी पेंशनभोगी अपात्र हैं।",
            "बैंक खाते का आधार से लिंक और e-KYC पूरा होना अनिवार्य है।",
        ],
        eligibility_criteria_en=[
            "All landholding farmer families having cultivable landholding in their names.",
            "Exclusions apply to institutional landholders, income tax payees, and employees.",
            "Aadhaar-seeded bank account and completed e-KYC are mandatory.",
        ],
        required_documents_hi=[
            "आधार कार्ड (Aadhaar Card)",
            "जमीन की अद्यतन जमाबंदी / खतौनी (Land Records)",
            "Aadhaar व NPCI से लिंक सक्रिय बैंक खाता",
            "मोबाइल नंबर (Aadhaar OTP सत्यापन के लिए)",
        ],
        required_documents_en=[
            "Aadhaar Card",
            "Land ownership record (Khatauni / Land registry)",
            "Active bank account linked with Aadhaar and NPCI mapper",
            "Mobile number linked to Aadhaar for OTP authentication",
        ],
        official_portal="https://pmkisan.gov.in",
        helpline="155261 / 1800115526 (टोल-फ्री हेल्पलाइन)",
    ),
    GovernmentScheme(
        id="kcc",
        name_hi="किसान क्रेडिट कार्ड (Kisan Credit Card - KCC)",
        name_en="Kisan Credit Card Scheme",
        category="credit",
        tagline_hi="मात्र 4% प्रभावी वार्षिक ब्याज दर पर ₹3 लाख तक का आसान कृषि ऋण",
        tagline_en="Affordable institutional credit up to ₹3 Lakh at an effective 4% interest rate",
        description_hi=(
            "KCC योजना किसानों को खेती की लागत, बीज, खाद, कीटनाशक और पशुपालन/डेयरी के लिए "
            "रियायती ब्याज दर पर समय पर संस्थागत ऋण उपलब्ध कराती है।"
        ),
        description_en=(
            "KCC ensures adequate and timely institutional credit for crop cultivation, farm "
            "maintenance, and allied activities at highly subsidized interest rates."
        ),
        benefits_hi=[
            "₹3,00,000 तक का ऋण 7% सामान्य ब्याज पर, समय पर भुगतान पर मात्र 4% प्रभावी ब्याज।",
            "₹1,60,000 तक के ऋण पर बिना किसी गिरवी (Collateral Free) के तुरंत स्वीकृति।",
            "कार्ड 5 वर्ष के लिए वैध, आवश्यकतानुसार कभी भी निकासी व जमा करने की सुविधा।",
            "पशुपालन, मत्स्य पालन और डेयरी गतिविधियों के लिए भी ₹2 लाख तक का KCC उपलब्ध।",
        ],
        benefits_en=[
            "Credit limit up to ₹3 Lakh at 7% base rate; drops to 4% with timely repayment.",
            "No collateral or mortgage required for loans up to ₹1.60 Lakh.",
            "Revolving cash credit valid for 5 years with flexible withdrawal via ATM/Debit card.",
            "Extended to animal husbandry, dairy, and fisheries up to ₹2 Lakh limit.",
        ],
        eligibility_criteria_hi=[
            "सभी व्यक्तिगत किसान, संयुक्त कृषक, काश्तकार किसान और स्वयं सहायता समूह (SHG)।",
            "आयु 18 से 75 वर्ष (60 वर्ष से अधिक आयु पर सह-आवेदक आवश्यक)।",
            "खेती, बागवानी या डेयरी/पशुपालन से जुड़े सभी किसान पात्र हैं।",
        ],
        eligibility_criteria_en=[
            "Individual farmers, joint cultivators, tenant farmers, and Self Help Groups.",
            "Age between 18 and 75 years (co-borrower required if age > 60).",
            "Engaged in crop production, allied activities, or animal husbandry.",
        ],
        required_documents_hi=[
            "भरा हुआ KCC आवेदन पत्र (Application Form)",
            "पहचान व पता प्रमाण (आधार कार्ड / वोटर आईडी)",
            "जमीन के राजस्व दस्तावेज (खसरा/खतौनी की सत्यापित प्रति)",
            "फसल बुवाई का विवरण (Crop Sowing Declaration)",
        ],
        required_documents_en=[
            "Duly filled KCC application form",
            "Identity and address proof (Aadhaar / Voter ID / PAN)",
            "Land ownership and cultivation documents (certified Khasra/Khatauni copy)",
            "Crop sowing declaration pattern",
        ],
        official_portal="https://www.myscheme.gov.in/schemes/kcc",
        helpline="18001801551 (Kisan Call Centre)",
    ),
    GovernmentScheme(
        id="soil-health-card",
        name_hi="मृदा स्वास्थ्य कार्ड योजना (Soil Health Card Scheme)",
        name_en="Soil Health Card Scheme",
        category="soil",
        tagline_hi="खेत की मिट्टी की 12 मापदंडों पर निःशुल्क जाँच और फसलवार संतुलित खाद की सलाह",
        tagline_en="Free biennial soil testing across 12 parameters with fertilizer advisory",
        description_hi=(
            "मृदा स्वास्थ्य कार्ड योजना के तहत हर 2 साल में किसान के खेत की मिट्टी की वैज्ञानिक "
            "जाँच कर 12 पोषक तत्वों का स्तर बताया जाता है और खाद की सही मात्रा की सिफारिश दी जाती है।"
        ),
        description_en=(
            "Under this scheme, farmers receive a comprehensive soil health card every 2 years "
            "indicating nutrient status and crop-specific fertilizer recommendations."
        ),
        benefits_hi=[
            "मिट्टी की 12 मापदंडों (N, P, K, S, Zn, Fe, Cu, Mn, B, pH, EC, OC) पर मुफ्त जाँच।",
            "अत्यधिक यूरिया व रासायनिक खाद के फिजूलखर्च में 15% से 25% तक की सीधी बचत।",
            "भूमि की उर्वरा शक्ति में वृद्धि और फसल की गुणवत्ता व पैदावार में सुधार।",
        ],
        benefits_en=[
            "Free testing of 12 nutrient parameters (N, P, K, S, Zn, Fe, Cu, Mn, B, pH, EC, OC).",
            "Reduces fertilizer cost by 15-25% by preventing unneeded urea/DAP overuse.",
            "Improves long-term soil fertility and enhances crop productivity.",
        ],
        eligibility_criteria_hi=[
            "देश के सभी राज्यों के सभी किसान इस योजना के पात्र हैं।",
            "जाँच कृषि विभाग द्वारा हर 2 वर्ष में चक्रानुक्रम से की जाती है।",
        ],
        eligibility_criteria_en=[
            "All farmers across all Indian states and Union Territories are eligible.",
            "Testing is conducted periodically by district soil testing laboratories.",
        ],
        required_documents_hi=[
            "खेत का खसरा नंबर और किसान का नाम व मोबाइल नंबर",
            "मिट्टी का नमूना (कृषि पर्यवेक्षक या किसान द्वारा एकत्रित)",
        ],
        required_documents_en=[
            "Farmer name, mobile number, and farm plot survey/Khasra number",
            "Soil sample collected following standard quadrant methodology",
        ],
        official_portal="https://soilhealth.dac.gov.in",
        helpline="18001801551",
    ),
    GovernmentScheme(
        id="pmksy",
        name_hi="प्रधानमंत्री कृषि सिंचाई योजना - 'प्रति बूँद अधिक फसल' (PMKSY)",
        name_en="Pradhan Mantri Krishi Sinchayee Yojana (Per Drop More Crop)",
        category="irrigation",
        tagline_hi="ड्रिप व स्प्रिंकलर सिंचाई सिस्टम लगाने पर 45% से 55% तक की भारी सरकारी सब्सिडी",
        tagline_en="45% to 55% subsidy on Micro-Irrigation (Drip and Sprinkler systems)",
        description_hi=(
            "PMKSY के तहत किसानों को अपने खेतों में आधुनिक ड्रिप (टपक) सिंचाई और स्प्रिंकलर "
            "(फव्वारा) सिस्टम लगाने के लिए भारी सरकारी अनुदान दिया जाता है।"
        ),
        description_en=(
            "Promotes micro-irrigation technologies to maximize water-use efficiency, "
            "conserve energy, and increase crop yields with generous government subsidies."
        ),
        benefits_hi=[
            "छोटे व सीमांत किसानों को लागत का 55% अनुदान (Subsidy)।",
            "अन्य सामान्य किसानों को लागत का 45% सरकारी अनुदान।",
            "सिंचाई में 40% से 50% पानी की बचत और उर्वरक क्षमता में 30% वृद्धि।",
            "कम पानी में भी अधिक पैदावार और बिजली/डीजल के बिल में कमी।",
        ],
        benefits_en=[
            "55% subsidy for small and marginal farmers (holding < 2 hectares).",
            "45% subsidy for other larger farmers.",
            "Water saving of 40-50% with higher fertilizer utilization through fertigation.",
            "Reduces weeding labor and electricity pumping expenses substantially.",
        ],
        eligibility_criteria_hi=[
            "सभी किसान जिनके पास सिंचाई के लिए अपना पानी का स्रोत उपलब्ध है।",
            "छोटे व सीमांत किसानों को प्राथमिकता।",
        ],
        eligibility_criteria_en=[
            "All landholding farmers having an assured source of water for irrigation.",
            "Priority granted to small, marginal, and women farmers.",
        ],
        required_documents_hi=[
            "आधार कार्ड व जमीन की जमाबंदी/खतौनी",
            "जल स्रोत का प्रमाण (विद्युत कनेक्शन या बोरवेल प्रमाण)",
            "बैंक पासबुक की प्रति",
            "खेत का नक्शा (Soil/field layout map)",
        ],
        required_documents_en=[
            "Aadhaar Card and Land Records (RoR)",
            "Proof of assured water source / electricity connection",
            "Bank passbook copy",
            "Farm layout diagram for micro-irrigation network",
        ],
        official_portal="https://pmksy.gov.in",
        helpline="18001801551",
    ),
    GovernmentScheme(
        id="smam",
        name_hi="कृषि यंत्रीकरण उप-मिशन (SMAM - Farm Machinery Subsidy)",
        name_en="Sub-Mission on Agricultural Mechanization",
        category="machinery",
        tagline_hi="ट्रैक्टर, रोटावेटर, रीपर, सीड ड्रिल व कृषि यंत्रों पर 40% से 50% सब्सिडी",
        tagline_en="40% to 50% capital subsidy on tractors, harvesters, and rotavators",
        description_hi=(
            "SMAM योजना के तहत किसानों को आधुनिक कृषि उपकरण व मशीनरी खरीदने के लिए "
            "40% से 50% सब्सिडी और कस्टम हायरिंग सेंटर (CHC) खोलने के लिए 80% तक सहायता दी जाती है।"
        ),
        description_en=(
            "SMAM promotes farm mechanization by providing direct capital subsidies on "
            "modern machinery and support up to 80% to establish Custom Hiring Centers (CHC)."
        ),
        benefits_hi=[
            "ट्रैक्टर, रोटावेटर, सीड ड्रिल, लेजर लैंड लेवलर आदि पर 40% से 50% तक सब्सिडी।",
            "कस्टम हायरिंग सेंटर (CHC) स्थापित करने के लिए समूहों को 80% तक सहायता।",
            "समय और श्रम की बचत, पराली प्रबंधन व सटीक बुवाई में भारी सहायता।",
        ],
        benefits_en=[
            "40% to 50% subsidy on purchase of individual equipment (rotavators, seed-drills).",
            "Up to 80% project assistance to set up village Custom Hiring Centers (CHC).",
            "Empowers modern crop residue management and precision cultivation.",
        ],
        eligibility_criteria_hi=[
            "सभी किसान (विशेषकर छोटे, सीमांत, महिला व अनुसूचित जाति/जनजाति के किसान)।",
            "किसान के पास पहले से उस यंत्र पर पिछले 3-5 वर्षों में सब्सिडी न ली गई हो।",
        ],
        eligibility_criteria_en=[
            "All landholding farmers, farmer producer organizations (FPOs), and cooperatives.",
            "Beneficiary must not have received subsidy for the same implement recently.",
        ],
        required_documents_hi=[
            "आधार कार्ड, पैन कार्ड व बैंक पासबुक",
            "जमीन की खसरा/खतौनी नकल",
            "जाति प्रमाण पत्र (यदि लागू हो)",
            "यंत्र का कोटेशन (अधिकृत डीलर से)",
        ],
        required_documents_en=[
            "Aadhaar Card, PAN, and Bank passbook",
            "Land ownership record (Khatauni)",
            "Caste certificate (if claiming SC/ST category benefits)",
            "Quotation of equipment from authorized dealer",
        ],
        official_portal="https://agrimachinery.nic.in",
        helpline="18001801551",
    ),
]
