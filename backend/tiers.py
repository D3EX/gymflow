# backend/app/tiers.py
"""
Hardcoded SaaS subscription tiers for gym owners.
These are NOT the same as app.models.models.Plan (which is a
gym's own membership plan sold to its members, e.g. "Monthly Basic").
This is the tier the GYM OWNER is paying GymFlow for.
"""

SUBSCRIPTION_TIERS = {
    "basic": {
        "label": "Basic",
        "max_coaches": 2,
        "max_members": 50,
        "price_monthly": 0,  # adjust to your real pricing
    },
    "pro": {
        "label": "Pro",
        "max_coaches": 8,
        "max_members": 300,
        "price_monthly": 0,
    },
    "enterprise": {
        "label": "Enterprise",
        "max_coaches": 999999,  # effectively unlimited
        "max_members": 999999,
        "price_monthly": 0,
    },
}

DEFAULT_TIER = "basic"


def get_tier_limits(tier_key: str) -> dict:
    return SUBSCRIPTION_TIERS.get(tier_key, SUBSCRIPTION_TIERS[DEFAULT_TIER])