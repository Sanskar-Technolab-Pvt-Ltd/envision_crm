# Copyright (c) 2025, Envision and contributors
# For license information, please see license.txt
# Copyright (c) 2025, Envision and contributors
# For license information, please see license.txt
# Copyright (c) 2025, Envision and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    data = get_data(filters)
    columns = get_columns()
    return columns, data

def get_columns():
    return [
        {"label": "Status", "fieldname": "status", "fieldtype": "Data", "width": 150},
        {"label": "Opportunity Count", "fieldname": "opp_count", "fieldtype": "Int", "width": 150},
        {"label": "Sum of Opportunity Value", "fieldname": "opp_value", "fieldtype": "Currency", "width": 180},
        {"label": "% on Count", "fieldname": "count_percent", "fieldtype": "Percent", "width": 120},
        {"label": "% on Value", "fieldname": "value_percent", "fieldtype": "Percent", "width": 120},
    ]

def get_data(filters=None):
    filters = filters or {}

    conditions = {}
    if filters.get("company"):
        conditions["company"] = filters.get("company")
    if filters.get("custom_department"):
        conditions["custom_department"] = filters.get("custom_department")
    if filters.get("opportunity_owner"):
        conditions["opportunity_owner"] = filters.get("opportunity_owner")
    if filters.get("status"):
        conditions["status"] = filters.get("status")
    if filters.get("from_date") and filters.get("to_date"):
        conditions["transaction_date"] = ["between", [filters.get("from_date"), filters.get("to_date")]]

    opportunities = frappe.get_all(
        "Opportunity",
        filters=conditions,
        fields=["status", "opportunity_amount"]
    )

    summary = {}
    total_count = 0
    total_value = 0

    for opp in opportunities:
        status = opp.status or "Unknown"
        amount = opp.opportunity_amount or 0

        if status not in summary:
            summary[status] = {"count": 0, "value": 0}

        summary[status]["count"] += 1
        summary[status]["value"] += amount

        total_count += 1
        total_value += amount

    data = []
    for status, vals in summary.items():
        count = vals["count"]
        value = vals["value"]

        count_percent = (count / total_count * 100) if total_count else 0
        value_percent = (value / total_value * 100) if total_value else 0

        data.append({
            "status": status,
            "opp_count": count,
            "opp_value": value,
            "count_percent": count_percent,
            "value_percent": value_percent,
        })

    return data
