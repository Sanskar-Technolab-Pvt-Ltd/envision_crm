# Copyright (c) 2025, Envision and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import get_datetime, getdate, formatdate


def execute(filters=None):
	# ? EXECUTE REPORT AND RETURN COLUMNS AND DATA
	columns = get_columns(filters)
	data = get_data(filters)
	return columns, data


def get_columns(filters=None):
	# ? DEFINE REPORT COLUMNS
	return [
		{"label": "Opportunity ID", "fieldname": "name", "fieldtype": "Link", "options": "Opportunity", "width": 120},
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
	# ? BUILD DYNAMIC FILTER CONDITIONS
	conditions = {}

	if filters.get("company"):
		conditions["company"] = filters.get("company")

	if filters.get("custom_department"):
		conditions["custom_department"] = filters.get("custom_department")

	if filters.get("status"):
		conditions["status"] = filters.get("status")

	if filters.get("opportunity_owner"):
		conditions["opportunity_owner"] = filters.get("opportunity_owner")

	# ? APPLY DATE RANGE FILTERS IF PROVIDED
	if filters.get("from_date") and filters.get("to_date"):
		conditions["creation"] = [
			"between",
			[
				get_datetime(filters.get("from_date") + " 00:00:00"),
				get_datetime(filters.get("to_date") + " 23:59:59"),
			],
		]
	elif filters.get("from_date"):
		conditions["creation"] = [">=", get_datetime(filters.get("from_date") + " 00:00:00")]
	elif filters.get("to_date"):
		conditions["creation"] = ["<=", get_datetime(filters.get("to_date") + " 23:59:59")]

	return conditions


def get_data(filters=None):
	# ? FETCH AND PREPARE REPORT DATA
	data = []
	conditions = get_conditions(filters or {})

	opportunities = frappe.get_all(
		"Opportunity",
		filters=conditions,
		fields=["*"],
		order_by="creation desc",
	)

	for opp in opportunities:

		expected_month = None
		expected_month_sort = None

		if opp.expected_closing:
			# ? FORMAT EXPECTED MONTH AS MMM-YY FOR DISPLAY
			expected_month = formatdate(opp.expected_closing, "MMM-yy")

			# ? CREATE SYSTEM SORT KEY USING FIRST DAY OF EXPECTED MONTH
			expected_month_sort = getdate(opp.expected_closing).replace(day=1)

		# ? CALCULATE PROBABLE VALUE BASED ON PROBABILITY
		probable_value = (opp.opportunity_amount or 0) * ((opp.probability or 0) / 100)

		# ? FETCH APPROVED QUOTATIONS LINKED TO OPPORTUNITY
		quotations = frappe.db.get_all(
			"Quotation",
			filters={"opportunity": opp.name, "docstatus": 1},
			fields=["name"],
		)
		quotation_names = ", ".join(q.name for q in quotations)

		# ? FETCH APPROVED SALES ORDERS LINKED TO OPPORTUNITY
		sales_orders = frappe.db.get_all(
			"Sales Order",
			filters={"opportunity": opp.name, "docstatus": 1},
			fields=["total", "transaction_date"],
		)

		# ? CALCULATE SALES ORDER TOTAL
		sales_order_total = sum(so.total for so in sales_orders)

		# ? FORMAT SALES ORDER MONTHS AS MMM-YY
		sales_order_months = ", ".join(
			formatdate(so.transaction_date, "MMM-yy")
			for so in sales_orders
			if so.transaction_date
		)

		data.append({
			# ? OPPORTUNITY BASIC DETAILS
			"name": opp.name,
			"department": opp.custom_department,
			"opportunity_owner": opp.opportunity_owner,
			"opportunity_type": opp.opportunity_type,
			"customer_name": opp.customer_name,

			# ? PROJECT CLASSIFICATION
			"project_type": opp.custom_project_type,
			"project_sub_type": opp.custom_project_sub_type,
			"project_sub_type_2": opp.custom_project_sub_type_2,

			# ? FINANCIAL AND FORECAST DETAILS
			"opportunity_amount": opp.opportunity_amount,
			"probability": opp.probability,
			"expected_month": expected_month,
			"_expected_month_sort": expected_month_sort,
			"probable_value": probable_value,

			# ? STATUS AND PIPELINE DETAILS
			"status": opp.status,
			"sales_stage": opp.sales_stage,
			"comments": opp._comments,

			# ? LINKED DOCUMENTS
			"quotations": quotation_names,
			"sales_order_net_total": sales_order_total,
			"sales_order_month": sales_order_months,
		})

	# ? SORT DATA BY EXPECTED MONTH CHRONOLOGICALLY
	data.sort(
		key=lambda x: x.get("_expected_month_sort") or getdate("2999-12-31")
	)

	# ? REMOVE INTERNAL SORT FIELD BEFORE RETURNING DATA
	for row in data:
		row.pop("_expected_month_sort", None)

	return data
