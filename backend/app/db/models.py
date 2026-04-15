from __future__ import annotations

from sqlalchemy import Column, String, JSON, Float, Date, Integer, Text
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class TestCatalogDB(Base):
    __tablename__ = "test_catalog"

    id = Column(Integer, primary_key=True, autoincrement=True)
    test_code = Column(String, unique=True, nullable=False, index=True)
    test_name = Column(String, nullable=False)
    cpt_codes = Column(JSON, default=list)
    description = Column(Text, default="")
    category = Column(String, default="")
    price = Column(Float, nullable=True)
    turnaround_time = Column(String, nullable=True)


class PayorRuleDB(Base):
    __tablename__ = "payor_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    payor_name = Column(String, nullable=False)
    payor_code = Column(String, nullable=False, index=True)
    test_category = Column(String, nullable=False)
    policy_version = Column(String, default="")
    effective_date = Column(Date, nullable=True)
    accepted_cpt_codes = Column(JSON, default=list)
    accepted_icd10_categories = Column(JSON, default=list)
    medical_necessity_criteria = Column(JSON, default=list)
    required_documentation = Column(JSON, default=list)
    ordering_provider_requirements = Column(JSON, default=list)
    prior_testing_requirements = Column(JSON, default=list)
    submission_channel = Column(String, default="")
    submission_notes = Column(Text, nullable=True)
    exclusions = Column(JSON, default=list)


class EvaluationDB(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    evaluation_id = Column(String, unique=True, nullable=False, index=True)
    order_id = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
    denial_risk = Column(String, default="")
    summary = Column(Text, default="")
    full_result = Column(JSON, default=dict)
