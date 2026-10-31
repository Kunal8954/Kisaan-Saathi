"""Scheme retrieval, eligibility calculation, and claim advisory service."""

from __future__ import annotations

from typing import Any

from app.models.scheme import (
    GovernmentScheme,
    SchemeAdviceRequest,
    SchemeAdviceResponse,
    SchemeEligibilityInput,
    SchemeEligibilityResult,
)
from app.services.schemes_data import VERIFIED_SCHEMES


def get_all_schemes(category: str | None = None) -> list[GovernmentScheme]:
    """Return all verified schemes, optionally filtered by category."""
    if not category or category == "all":
        return VERIFIED_SCHEMES
    return [s for s in VERIFIED_SCHEMES if s.category == category]


def get_scheme_by_id(scheme_id: str) -> GovernmentScheme | None:
    """Find a specific scheme by ID."""
    scheme_id_clean = scheme_id.strip().lower()
    for s in VERIFIED_SCHEMES:
        if s.id == scheme_id_clean:
            return s
    return None


def evaluate_farmer_eligibility(
    farmer: SchemeEligibilityInput,
) -> list[SchemeEligibilityResult]:
    """Evaluate eligibility and quantify benefits across all major schemes."""
    results: list[SchemeEligibilityResult] = []
    land_ha = farmer.land_size_hectares
    is_marginal_or_small = land_ha <= 2.0

    # 1. PMFBY Evaluation
    results.append(
        SchemeEligibilityResult(
            scheme_id="pmfby",
            scheme_name_hi="प्रधानमंत्री फसल बीमा योजना (PMFBY)",
            scheme_name_en="Pradhan Mantri Fasal Bima Yojana",
            is_eligible=farmer.has_aadhaar and farmer.has_bank_account,
            status_label_hi="पूर्णतः पात्र (Eligible)",
            status_label_en="Eligible",
            estimated_benefit_hi="फसल नुकसान पर 100% बीमित राशि तक सुरक्षा (प्रीमियम: 1.5% - 2%)",
            estimated_benefit_en="Coverage up to full sum insured (Premium: 1.5% - 2% only)",
            reason_hi=(
                f"आपके पास {land_ha:.1f} हेक्टेयर भूमि व बैंक खाता है। "
                "रबी के लिए 1.5% व खरीफ के लिए केवल 2% प्रीमियम देकर फसल सुरक्षित करें।"
            ),
            reason_en=(
                f"With {land_ha:.1f} ha land and a bank account, your crops can be fully "
                "insured at a modest 1.5% to 2% premium."
            ),
            next_step_hi="नजदीकी बैंक या pmfby.gov.in पर कट-ऑफ तिथि से पहले प्रीमियम कटवाएं।",
            next_step_en="Visit your bank or pmfby.gov.in before seasonal cut-off deadline.",
        )
    )

    # 2. PM-KISAN Evaluation
    is_pm_kisan_eligible = farmer.is_landowner and farmer.has_aadhaar and farmer.has_bank_account
    results.append(
        SchemeEligibilityResult(
            scheme_id="pm-kisan",
            scheme_name_hi="प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)",
            scheme_name_en="Pradhan Mantri Kisan Samman Nidhi",
            is_eligible=is_pm_kisan_eligible,
            status_label_hi=(
                "पूर्णतः पात्र (Eligible)" if is_pm_kisan_eligible else "भूमि स्वामित्व आवश्यक"
            ),
            status_label_en="Eligible" if is_pm_kisan_eligible else "Land Title Required",
            estimated_benefit_hi="₹6,000 प्रति वर्ष (₹2,000 की 3 समान किस्तों में सीधे बैंक में)",
            estimated_benefit_en="₹6,000 per year (3 equal DBT installments of ₹2,000)",
            reason_hi=(
                "भूमिधारक किसान परिवार होने के कारण आप वार्षिक ₹6,000 सहायता के पात्र हैं।"
                if is_pm_kisan_eligible
                else "PM-KISAN के लिए किसान के नाम पर जमीन की खतौनी होना अनिवार्य है।"
            ),
            reason_en=(
                "Eligible for direct income support of ₹6,000/yr transferred via DBT."
                if is_pm_kisan_eligible
                else "Land ownership title registered in farmer's name is mandatory."
            ),
            next_step_hi="pmkisan.gov.in पर e-KYC पूरा करें और लाभार्थी स्थिति चेक करें।",
            next_step_en="Complete Aadhaar e-KYC on pmkisan.gov.in for seamless disbursement.",
        )
    )

    # 3. KCC (Kisan Credit Card) Evaluation
    kcc_credit_limit = min(300_000, max(50_000, int(land_ha * 75_000)))
    results.append(
        SchemeEligibilityResult(
            scheme_id="kcc",
            scheme_name_hi="किसान क्रेडिट कार्ड (KCC)",
            scheme_name_en="Kisan Credit Card Scheme",
            is_eligible=farmer.has_bank_account and farmer.has_aadhaar,
            status_label_hi="पूर्णतः पात्र (Eligible)",
            status_label_en="Eligible",
            estimated_benefit_hi=f"लगभग ₹{kcc_credit_limit:,} तक का ऋण मात्र 4% प्रभावी ब्याज पर",
            estimated_benefit_en=f"Credit limit up to approx ₹{kcc_credit_limit:,} at 4% interest",
            reason_hi=(
                f"{land_ha:.1f} ha जोत पर लगभग ₹{kcc_credit_limit:,} की लिमिट स्वीकृत हो सकती है। "
                "समय पर चुकाने पर मात्र 4% ब्याज दर लगती है।"
            ),
            reason_en=(
                f"Eligible for subsidized agricultural credit of approx ₹{kcc_credit_limit:,} "
                "with interest subvention reducing rate to 4%."
            ),
            next_step_hi="बैंक शाखा में खसरा/खतौनी की प्रति और आधार देकर KCC फॉर्म भरें।",
            next_step_en="Submit simplified KCC form along with land records to your bank.",
        )
    )

    # 4. PMKSY Micro-Irrigation Evaluation
    subsidy_pct = 55 if is_marginal_or_small else 45
    farmer_size_label = "small/marginal" if is_marginal_or_small else "large"
    results.append(
        SchemeEligibilityResult(
            scheme_id="pmksy",
            scheme_name_hi="प्रधानमंत्री कृषि सिंचाई योजना (PMKSY)",
            scheme_name_en="PMKSY Per Drop More Crop",
            is_eligible=farmer.is_landowner,
            status_label_hi=f"पात्र ({subsidy_pct}% सरकारी सब्सिडी)",
            status_label_en=f"Eligible ({subsidy_pct}% Subsidy)",
            estimated_benefit_hi=f"ड्रिप व फव्वारा सिंचाई सिस्टम लगाने पर लागत का {subsidy_pct}% अनुदान",
            estimated_benefit_en=f"{subsidy_pct}% subsidy on drip/sprinkler installation",
            reason_hi=(
                f"आप {('छोटे/सीमांत' if is_marginal_or_small else 'मध्यम/बड़े')} किसान हैं। "
                f"आपको ड्रिप/स्प्रिंकलर संयंत्र पर {subsidy_pct}% सरकारी सब्सिडी मिलेगी।"
            ),
            reason_en=(
                f"As a {farmer_size_label} farmer, you qualify for "
                f"{subsidy_pct}% capital subsidy on micro-irrigation."
            ),
            next_step_hi="राज्य कृषि पोर्टल या जिला कृषि उपनिदेशक कार्यालय में आवेदन करें।",
            next_step_en="Apply via state agriculture department portal with water source proof.",
        )
    )

    # 5. Soil Health Card Evaluation
    results.append(
        SchemeEligibilityResult(
            scheme_id="soil-health-card",
            scheme_name_hi="मृदा स्वास्थ्य कार्ड योजना (Soil Health Card)",
            scheme_name_en="Soil Health Card Scheme",
            is_eligible=True,
            status_label_hi="100% निःशुल्क (Free)",
            status_label_en="100% Free Service",
            estimated_benefit_hi="निःशुल्क 12 मापदंडों पर मिट्टी जाँच + खाद खर्च में 20% तक की बचत",
            estimated_benefit_en="Free 12-parameter soil test + up to 20% savings on fertilizers",
            reason_hi="सभी कृषक हर 2 वर्ष में अपने खेत की मिट्टी की मुफ्त जाँच कराने के पात्र हैं।",
            reason_en="All farmers are entitled to biennial free laboratory soil testing.",
            next_step_hi="हमारे 'मिट्टी' टैब में जाकर अपनी रिपोर्ट अपलोड करें या कृषि सहायक से मिलें।",
            next_step_en="Upload report on our Soil Analyst tab or submit sample to lab.",
        )
    )

    # 6. SMAM Machinery Subsidy Evaluation
    machinery_subsidy_pct = 50 if is_marginal_or_small else 40
    results.append(
        SchemeEligibilityResult(
            scheme_id="smam",
            scheme_name_hi="कृषि यंत्रीकरण उप-मिशन (SMAM)",
            scheme_name_en="Sub-Mission on Agricultural Mechanization",
            is_eligible=farmer.has_aadhaar and farmer.is_landowner,
            status_label_hi=f"पात्र ({machinery_subsidy_pct}% सब्सिडी)",
            status_label_en=f"Eligible ({machinery_subsidy_pct}% Subsidy)",
            estimated_benefit_hi=f"ट्रैक्टर व कृषि यंत्रों पर {machinery_subsidy_pct}% तक सरकारी छूट",
            estimated_benefit_en=f"Up to {machinery_subsidy_pct}% subsidy on modern farm equipment",
            reason_hi=f"कृषि यंत्रों पर {machinery_subsidy_pct}% तक वित्तीय सहायता सीधे बैंक में दी जाती है।",
            reason_en=f"Eligible for {machinery_subsidy_pct}% subsidy on approved farm machinery.",
            next_step_hi="agrimachinery.nic.in पर जाकर अपने पसंदीदा यंत्र के लिए टोकन लें।",
            next_step_en="Register on agrimachinery.nic.in with dealer quotation for token.",
        )
    )

    return results


def answer_scheme_query(request: SchemeAdviceRequest) -> SchemeAdviceResponse:
    """Provide grounded answers and claim assistance for farmer questions."""
    q = request.question.lower()

    # Case 1: Insurance claim / PMFBY claim assistance
    if any(k in q for k in ["claim", "दावा", "72", "beema", "bima", "बीमा", "नुकसान", "loss"]):
        pmfby = get_scheme_by_id("pmfby")
        answer_hi = (
            "प्रधानमंत्री फसल बीमा योजना (PMFBY) में फसल नुकसान पर दावा करने के लिए "
            "**स्थानीय प्राकृतिक आपदा होने के 72 घंटे के भीतर सूचना देना अनिवार्य है।**\n\n"
            "दावा दर्ज करने के 4 आसान तरीके:\n"
            "1. **क्रॉप इंश्योरेंस ऐप (Crop Insurance App)**: ऐप में खेत की फोटो सहित दावा दर्ज करें।\n"
            "2. **टोल-फ्री नंबर 14447**: तुरंत 14447 पर कॉल करके पॉलिसी संख्या बताकर सूचना दें।\n"
            "3. **संबंधित बैंक शाखा**: जिस बैंक से प्रीमियम कटा है, वहां लिखित सूचना दें।\n"
            "4. **कृषि अधिकारी**: ग्राम पंचायत के कृषि पर्यवेक्षक या पटवारी को लिखित सूचना दें।\n\n"
            "सूचना के 48 घंटे में सर्वेक्षक नियुक्त होता है और 10 दिन में सर्वे पूरा होता है। "
            "इसके 21 दिनों में क्लेम राशि सीधे बैंक खाते में आ जाती है।"
        )
        answer_en = (
            "Under PMFBY, it is mandatory to intimate localized crop loss "
            "**within 72 hours** of the calamity.\n\n"
            "Ways to file an intimation:\n"
            "1. **Crop Insurance Mobile App**: Submit claim with geotagged field photos.\n"
            "2. **Toll-Free Helpline 14447**: Call and register your claim using your Aadhaar.\n"
            "3. **Bank Branch**: Submit written intimation where premium was debited.\n"
            "4. **Agriculture Department**: Contact your local block agriculture officer.\n\n"
            "Survey is conducted within 10 days, and claim is credited within 21 days via DBT."
        )

        claim_assistance: dict[str, Any] = {
            "emergency_window": "72 घंटे (Mandatory within 72 Hours)",
            "toll_free": "14447",
            "app_name": "Crop Insurance App (Government of India)",
            "required_documents": [
                "Aadhaar Card",
                "Khasra/Khatauni land record",
                "Crop insurance policy / Bank debit slip",
                "Damage photos with geotag",
            ],
            "timeline": "Survey within 10 days, Payment within 21 days",
        }

        return SchemeAdviceResponse(
            query=request.question,
            answer_hi=answer_hi,
            answer_en=answer_en,
            relevant_schemes=[pmfby] if pmfby else [],
            claim_assistance=claim_assistance,
            sources=[
                "PMFBY Operational Guidelines (Rev. 2024)",
                "Department of Agriculture & Farmers Welfare",
                "pmfby.gov.in Official Portal",
            ],
        )

    # Case 2: PM-KISAN installment / status
    if any(k in q for k in ["pm-kisan", "pmkisan", "kisan samman", "6000", "किस्त", "installment"]):
        pm_kisan = get_scheme_by_id("pm-kisan")
        answer_hi = (
            "PM-KISAN योजना में पात्र किसानों को हर साल ₹6,000 तीन किस्तों "
            "(₹2,000 प्रत्येक) में दिए जाते हैं।\n\n"
            "किस्त प्राप्त करने के 3 जरूरी नियम:\n"
            "1. **आधार e-KYC अनिवार्य है**: pmkisan.gov.in पर जाकर आधार OTP द्वारा पूरा करें।\n"
            "2. **बैंक खाता आधार से सीडेड होना चाहिए**: बैंक में जाकर आधार लिंकिंग सुनिश्चित करें।\n"
            "3. **भूमि विवरण सत्यापित होना चाहिए**: राजस्व विभाग द्वारा खतौनी का सत्यापन आवश्यक है।\n\n"
            "अपनी अगली किस्त देखने के लिए pmkisan.gov.in पर 'Know Your Status' पर चेक करें।"
        )
        answer_en = (
            "PM-KISAN provides ₹6,000 annually in 3 equal installments of ₹2,000 via DBT.\n\n"
            "Mandatory criteria to receive installments:\n"
            "1. **Aadhaar e-KYC**: Must be completed online via OTP on pmkisan.gov.in.\n"
            "2. **NPCI Aadhaar-Seeded Bank Account**: Bank account must be mapped to receive DBT.\n"
            "3. **Land Seeding**: Land records must be validated by the revenue department.\n\n"
            "Check status on pmkisan.gov.in via 'Know Your Status' with registration number."
        )

        return SchemeAdviceResponse(
            query=request.question,
            answer_hi=answer_hi,
            answer_en=answer_en,
            relevant_schemes=[pm_kisan] if pm_kisan else [],
            sources=[
                "PM-KISAN Operational Guidelines",
                "pmkisan.gov.in Official Portal",
            ],
        )

    # Case 3: Kisan Credit Card (KCC) loans & interest
    if any(k in q for k in ["kcc", "ऋण", "loan", "क्रेडिट", "credit", "ब्याज", "interest", "4%"]):
        kcc = get_scheme_by_id("kcc")
        answer_hi = (
            "किसान क्रेडिट कार्ड (KCC) योजना किसानों को बेहद कम ब्याज पर कृषि ऋण उपलब्ध कराती है:\n\n"
            "1. **ब्याज दर मात्र 4%**: मूल ब्याज 7% है, लेकिन समय पर भुगतान पर 3% छूट मिलती है, "
            "जिससे प्रभावी ब्याज दर केवल 4% वार्षिक रह जाती है।\n"
            "2. **बिना गारंटी (Collateral-Free)**: ₹1.60 लाख तक के ऋण पर जमीन गिरवी नहीं रखनी होती।\n"
            "3. **लोन लिमिट**: ₹3 लाख तक का ऋण खेती की लागत, बीज व खाद के लिए आसानी से मिलता है।\n"
            "4. **पशुपालन व डेयरी**: पशुपालकों को भी ₹2 लाख तक का KCC मिलता है।"
        )
        answer_en = (
            "Kisan Credit Card (KCC) offers low-cost working capital for farmers:\n\n"
            "1. **Effective 4% Interest**: Base interest 7% drops to 4% upon prompt repayment.\n"
            "2. **Collateral-Free**: No collateral needed for limits up to ₹1.60 Lakh.\n"
            "3. **Credit Limit**: Up to ₹3 Lakh for crop production and inputs.\n"
            "4. **Animal Husbandry**: Dairy and fisheries farmers can access KCC up to ₹2 Lakh."
        )

        return SchemeAdviceResponse(
            query=request.question,
            answer_hi=answer_hi,
            answer_en=answer_en,
            relevant_schemes=[kcc] if kcc else [],
            sources=[
                "Reserve Bank of India KCC Master Circular",
                "NABARD Farm Credit Guidelines",
            ],
        )

    # Default general overview
    answer_hi = (
        "भारतीय किसानों के लिए प्रमुख सरकारी योजनाएं:\n"
        "1. **PMFBY**: प्राकृतिक आपदा से फसल सुरक्षा (खरीफ 2%, रबी 1.5% प्रीमियम)। 72 घंटे में दावा आवश्यक।\n"
        "2. **PM-KISAN**: सभी पात्र किसान परिवारों को प्रति वर्ष ₹6,000 की नकद सहायता।\n"
        "3. **KCC**: ₹3 लाख तक का कृषि ऋण मात्र 4% प्रभावी ब्याज दर पर।\n"
        "4. **PMKSY**: ड्रिप व फव्वारा सिंचाई सिस्टम पर 45% से 55% सब्सिडी।\n"
        "5. **मृदा स्वास्थ्य कार्ड**: 12 तत्वों पर निःशुल्क मिट्टी परीक्षण।"
    )
    answer_en = (
        "Major government welfare and financial security schemes for Indian farmers:\n"
        "1. **PMFBY**: Crop insurance against calamities (Kharif 2%, Rabi 1.5% premium).\n"
        "2. **PM-KISAN**: ₹6,000 annual direct income support in 3 installments.\n"
        "3. **KCC**: Farm loans up to ₹3 Lakh at an effective interest rate of only 4%.\n"
        "4. **PMKSY**: 45% to 55% capital subsidy on micro-irrigation systems.\n"
        "5. **Soil Health Card**: Free biennial soil analysis across 12 nutrient parameters."
    )

    return SchemeAdviceResponse(
        query=request.question,
        answer_hi=answer_hi,
        answer_en=answer_en,
        relevant_schemes=VERIFIED_SCHEMES[:4],
        sources=[
            "Ministry of Agriculture & Farmers Welfare (MoA&FW)",
            "National Portal of India (india.gov.in)",
        ],
    )
