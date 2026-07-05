# backend/app/tiers.py
#
# Shared helpers for the super admin's GYM subscription tiers (coach/member
# limits + price that the platform sells to gyms). Completely separate from
# the `plans` table, which a gym uses to sell membership plans to its own
# members — never mix the two.
#
# `DEFAULT_TIERS_SEED` is only used to populate the `subscription_tiers`
# table the first time the app runs against an empty table. After that, the
# database (SubscriptionTier model) is the single source of truth — tiers
# are edited through the Super Admin "Plans & Tiers" screen, not this file.

from typing import Optional
from sqlalchemy.orm import Session

from .models.models import SubscriptionTier

DEFAULT_TIER = "basic"

DEFAULT_TIERS_SEED = [
    {
        "key": "basic",
        "name": "Basic",
        "price": 5000,
        "max_coaches": 2,
        "max_members": 50,
        "features": [
            "Up to 2 coaches",
            "Up to 50 members",
            "Basic reporting",
            "Email support",
        ],
    },
    {
        "key": "pro",
        "name": "Pro",
        "price": 15000,
        "max_coaches": 5,
        "max_members": 200,
        "features": [
            "Up to 5 coaches",
            "Up to 200 members",
            "Advanced reporting",
            "Priority support",
            "Custom branding",
        ],
    },
    {
        "key": "premium",
        "name": "Premium",
        "price": 35000,
        "max_coaches": 15,
        "max_members": 500,
        "features": [
            "Up to 15 coaches",
            "Up to 500 members",
            "Full analytics suite",
            "24/7 priority support",
            "Custom branding",
            "API access",
        ],
    },
    {
        "key": "enterprise",
        "name": "Enterprise",
        "price": None,  # "Contact us"
        "max_coaches": 999,
        "max_members": 9999,
        "features": [
            "Unlimited coaches",
            "Unlimited members",
            "Enterprise SLA",
            "Dedicated account manager",
            "Full API access",
            "Custom integrations",
        ],
    },
]


def ensure_tiers_seeded(db: Session):
    """First-run only: populate subscription_tiers from the hardcoded defaults
    if the table is empty. After this, the DB is the source of truth."""
    if db.query(SubscriptionTier).first() is not None:
        return
    for seed in DEFAULT_TIERS_SEED:
        db.add(SubscriptionTier(**seed))
    db.commit()


def get_tier_by_key(db: Session, key: str) -> Optional[SubscriptionTier]:
    ensure_tiers_seeded(db)
    return db.query(SubscriptionTier).filter(SubscriptionTier.key == key).first()


def get_tier_limits(db: Session, tier_key: str) -> dict:
    """Return the limits for a given tier key, falling back to the default
    tier if the key doesn't exist (e.g. was deleted after a gym was assigned
    to it). Any router that needs to check a gym's coach/member limits
    should call this — e.g. members.py before creating a new member,
    staff.py before creating a new coach."""
    tier = get_tier_by_key(db, tier_key) or get_tier_by_key(db, DEFAULT_TIER)
    if not tier:
        return {"max_coaches": 0, "max_members": 0, "price": None, "features": []}
    return {
        "max_coaches": tier.max_coaches,
        "max_members": tier.max_members,
        "price": tier.price,
        "features": tier.features or [],
    }