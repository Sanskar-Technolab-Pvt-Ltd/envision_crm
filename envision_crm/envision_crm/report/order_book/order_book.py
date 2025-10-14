# Copyright (c) 2025, Envision and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import get_datetime, add_days


def execute(filters=None):
	columns, data = get_columns(filters), get_data(filters)
	return columns, data

def get_columns(filters=None):
	return [
		{"label": "Opportunity ID", "fieldname": "name", "fieldtype": "Link","options":"Opportunity", "width": 120},
		{"label": "Department", "fieldname": "department", "fieldtype": "Data", "width": 120},
		{"label": "Opportunity Owner", "fieldname": "opportunity_owner", "fieldtype": "Data", "width": 150},
		{"label": "Opportunity Type", "fieldname": "opportunity_type", "fieldtype": "Data", "width": 120},
		{"label": "Customer Name", "fieldname": "customer_name", "fieldtype": "Data", "width": 150},
		{"label": "Project Type", "fieldname": "project_type", "fieldtype": "Data", "width": 120},
		{"label": "Project Sub Type", "fieldname": "project_sub_type", "fieldtype": "Data", "width": 140},
		{"label": "Project Sub Type 2", "fieldname": "project_sub_type_2", "fieldtype": "Data", "width": 150},
		{"label": "Opportunity Amount", "fieldname": "opportunity_amount", "fieldtype": "Currency", "width": 150},
		{"label": "Probability", "fieldname": "probability", "fieldtype": "Percent", "width": 100},
		{"label": "Expected Month", "fieldname": "expected_month", "fieldtype": "Data", "width": 120},
		{"label": "Probable Value", "fieldname": "probable_value", "fieldtype": "Currency", "width": 150},
		{"label": "Status", "fieldname": "status", "fieldtype": "Data", "width": 100},
		{"label": "Sales Stage", "fieldname": "sales_stage", "fieldtype": "Data", "width": 120},
		{"label": "Comments", "fieldname": "comments", "fieldtype": "Small Text", "width": 200},
		{"label": "Quotations", "fieldname": "quotations", "fieldtype": "Data", "width": 150},
		{"label": "Sales Order Net Total", "fieldname": "sales_order_net_total", "fieldtype": "Currency", "width": 180},
		{"label": "Sales Order Month", "fieldname": "sales_order_month", "fieldtype": "Data", "width": 150},
	]

def get_conditions(filters):
    conditions = {}

    if filters.get("company"):
        conditions["company"] = filters.get("company")
    if filters.get("custom_department"):
        # Only add if the field exists in Opportunity
        conditions["custom_department"] = filters.get("custom_department")
    if filters.get("status"):
        conditions["status"] = filters.get("status")
    if filters.get("opportunity_owner"):
        conditions["opportunity_owner"] = filters.get("opportunity_owner")

    # Only add date conditions if provided
    if filters.get("from_date") and filters.get("to_date"):
        from_datetime = get_datetime(filters.get("from_date") + " 00:00:00")
        to_datetime = get_datetime(filters.get("to_date") + " 23:59:59")
        conditions["creation"] = ["between", [from_datetime, to_datetime]]
    elif filters.get("from_date"):
        conditions["creation"] = [">=", get_datetime(filters.get("from_date") + " 00:00:00")]
    elif filters.get("to_date"):
        conditions["creation"] = ["<=", get_datetime(filters.get("to_date") + " 23:59:59")]

    return conditions


def get_data(filters=None):
	data=[]

	conditions = get_conditions(filters or {})

	opportunities = frappe.get_all(
			"Opportunity",
			filters = conditions,
			fields=[
				"*"
			],
			order_by="creation desc"
		)
    
	print("Opportunities",opportunities)
	for opp in opportunities:
		expected_month = frappe.utils.formatdate(opp.expected_closing, "MMMM") if opp.expected_closing else None

		probable_value = (opp.opportunity_amount or 0) * ((opp.probability or 0) / 100)

		quotations = frappe.db.get_all(
			"Quotation",
			filters={"opportunity": opp.name, "docstatus": 1},
			fields=["name"]
		)
		quotation_names = ", ".join(q.name for q in quotations)
		# quotation_total = sum(q.total for q in quotations)

		# sales orders linked
		sales_orders = frappe.db.get_all(
			"Sales Order",
			filters={"opportunity": opp.name, "docstatus": 1},
			fields=["total", "transaction_date"]
		)
		sales_order_total = sum(so.total for so in sales_orders)

		sales_order_months = ", ".join(
		[frappe.utils.formatdate(so.transaction_date, "MMM-yy") for so in sales_orders if so.transaction_date]
		)

		data.append({
			"name":opp.name,
			"department": opp.custom_department,
			"opportunity_owner": opp.opportunity_owner,
			"opportunity_type": opp.opportunity_type,
			"customer_name": opp.customer_name,
			"project_type": opp.custom_project_type,
			"project_sub_type": opp.custom_project_sub_type,
			"project_sub_type_2": opp.custom_project_sub_type_2,
			"opportunity_amount": opp.opportunity_amount,
			"probability": opp.probability,
			"expected_month": expected_month,
			"probable_value": probable_value,
			"status": opp.status,
			"sales_stage": opp.sales_stage,
			"comments": opp._comments,
			"quotations": quotation_names,
			"sales_order_net_total": sales_order_total,
			"sales_order_month": sales_order_months,
		})

	print("DATA:\n",data)
	return data

