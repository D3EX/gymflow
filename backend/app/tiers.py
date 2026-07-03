# backend/app/tiers.py

SUBSCRIPTION_TIERS = {
    "basic": {
        "max_coaches": 2,
        "max_members": 50,
        "price": 5000,
        "features": [
            "Up to 2 coaches",
            "Up to 50 members",
            "Basic reporting",
            "Email support"
        ]
    },
    "pro": {
        "max_coaches": 5,
        "max_members": 200,
        "price": 15000,
        "features": [
            "Up to 5 coaches",
            "Up to 200 members",
            "Advanced reporting",
            "Priority support",
            "Custom branding"
        ]
    },
    "premium": {
        "max_coaches": 15,
        "max_members": 500,
        "price": 35000,
        "features": [
            "Up to 15 coaches",
            "Up to 500 members",
            "Full analytics suite",
            "24/7 priority support",
            "Custom branding",
            "API access"
        ]
    },
    "enterprise": {
        "max_coaches": 999,
        "max_members": 9999,
        "price": None,
        "features": [
            "Unlimited coaches",
            "Unlimited members",
            "Enterprise SLA",
            "Dedicated account manager",
            "Full API access",
            "Custom integrations"
        ]
    }
}

DEFAULT_TIER = "basic"

def get_tier_limits(tier_name: str) -> dict:
    """Return the limits for a given tier."""
    tier = SUBSCRIPTION_TIERS.get(tier_name)
    if not tier:
        tier = SUBSCRIPTION_TIERS[DEFAULT_TIER]
    return {
        "max_coaches": tier["max_coaches"],
        "max_members": tier["max_members"],
        "price": tier["price"],
        "features": tier["features"]
    }