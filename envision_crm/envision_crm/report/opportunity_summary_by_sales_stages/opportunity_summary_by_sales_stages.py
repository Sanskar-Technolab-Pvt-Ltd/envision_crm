# Copyright (c) 2025, Envision and contributors
# For license information, please see license.txt

import json
from itertools import groupby
import frappe
from frappe import _
from frappe.utils import flt
from erpnext.setup.utils import get_exchange_rate

# ? Entry point for the report
def execute(filters=None):
	return OpportunitySummaryBySalesStages(filters).run()

class OpportunitySummaryBySalesStages:
	def __init__(self, filters=None):
		self.filters = frappe._dict(filters or {})

	# ? Main function to return report data, columns, chart
	def run(self):
		self.get_columns()
		self.get_data()
		self.get_chart_data()
		return self.columns, self.data, None, self.chart

	# ? Define report columns dynamically based on filter 'based_on' and sales stages
	def get_columns(self):
		self.columns = []

		# ? Show first column depending on grouping selection
		if self.filters.get("based_on") == "Opportunity Owner":
			self.columns.append(
				{"label": _("Opportunity Owner"), "fieldname": "opportunity_owner", "width": 200}
			)

		if self.filters.get("based_on") == "Source":
			self.columns.append(
				{
					"label": _("Source"),
					"fieldname": "source",
					"fieldtype": "Link",
					"options": "Lead Source",
					"width": 200,
				}
			)

		if self.filters.get("based_on") == "Opportunity Type":
			self.columns.append(
				{"label": _("Opportunity Type"), "fieldname": "opportunity_type", "width": 200}
			)

		# ? Append one column for each sales stage
		self.set_sales_stage_columns()

	# ? Get all Sales Stages and create a column for each based on count or amount
	def set_sales_stage_columns(self):
		self.sales_stage_list = frappe.db.get_list("Sales Stage", pluck="name")

		for sales_stage in self.sales_stage_list:
			if self.filters.get("data_based_on") == "Number":
				self.columns.append(
					{"label": _(sales_stage), "fieldname": sales_stage, "fieldtype": "Int", "width": 150}
				)
			elif self.filters.get("data_based_on") == "Amount":
				self.columns.append(
					{"label": _(sales_stage), "fieldname": sales_stage, "fieldtype": "Currency", "width": 150}
				)

	# ? Fetch and format data to be shown in rows
	def get_data(self):
		self.data = []

		# ? Determine grouping key
		based_on = {
			"Opportunity Owner": "opportunity_owner",
			"Source": "source",
			"Opportunity Type": "opportunity_type",
		}[self.filters.get("based_on")]

		# ? Select metric to report (count or amount)
		data_based_on = {
			"Number": "count(name) as count",
			"Amount": "opportunity_amount as amount",
		}[self.filters.get("data_based_on")]

		self.get_data_query(based_on, data_based_on)
		self.get_rows()

	# ? Get raw data from Opportunity Doctype
	def get_data_query(self, based_on, data_based_on):
		if self.filters.get("data_based_on") == "Number":
			# ? Group by stage and the selected dimension (e.g., Owner)
			group_by = "{},{}".format("sales_stage", based_on)
			self.query_result = frappe.db.get_list(
				"Opportunity",
				filters=self.get_conditions(),
				fields=["sales_stage", data_based_on, based_on],
				group_by=group_by,
			)
		elif self.filters.get("data_based_on") == "Amount":
			# ? Handle currency conversion before grouping
			self.query_result = frappe.db.get_list(
				"Opportunity",
				filters=self.get_conditions(),
				fields=["sales_stage", based_on, data_based_on, "currency"],
			)

			self.convert_to_base_currency()

			for row in self.query_result:
				if not row.get(based_on):
					row[based_on] = "Not Assigned"

			# ? Group and sum amounts per stage and dimension
			self.grouped_data = []

			grouping_key = lambda o: (o["sales_stage"], o[based_on])
			for (sales_stage, _based_on), rows in groupby(
				sorted(self.query_result, key=grouping_key), key=grouping_key
			):
				self.grouped_data.append(
					{
						"sales_stage": sales_stage,
						based_on: _based_on,
						"amount": sum(flt(r["amount"]) for r in rows),
					}
				)

			self.query_result = self.grouped_data

	# ? Prepare data for each row based on selected group and sales stage
	def get_rows(self):
		self.data = []
		self.get_formatted_data()

		for based_on, data in self.formatted_data.items():
			row_based_on = {
				"Opportunity Owner": "opportunity_owner",
				"Source": "source",
				"Opportunity Type": "opportunity_type",
			}[self.filters.get("based_on")]

			row = {row_based_on: based_on}

			for d in self.query_result:
				sales_stage = d.get("sales_stage")
				row[sales_stage] = data.get(sales_stage)

			self.data.append(row)

	# ? Organize raw data into structured format for row construction
	def get_formatted_data(self):
		self.formatted_data = frappe._dict()

		for d in self.query_result:
			data_based_on = {"Number": "count", "Amount": "amount"}[self.filters.get("data_based_on")]

			based_on = {
				"Opportunity Owner": "opportunity_owner",
				"Source": "source",
				"Opportunity Type": "opportunity_type",
			}[self.filters.get("based_on")]

			value = d.get(based_on) or "Not Assigned"
			sales_stage = d.get("sales_stage")
			count = d.get(data_based_on)
			self.set_formatted_data_based_on_sales_stage(value, sales_stage, count)

	# ? Set count/amount under correct sales stage and grouping value
	def set_formatted_data_based_on_sales_stage(self, based_on, sales_stage, count):
		self.formatted_data.setdefault(based_on, frappe._dict()).setdefault(sales_stage, 0)
		self.formatted_data[based_on][sales_stage] += count

	# ? Build filters based on user input from UI
	def get_conditions(self):
		filters = []

		if self.filters.get("company"):
			filters.append({"company": self.filters.get("company")})

		if self.filters.get("opportunity_type"):
			filters.append({"opportunity_type": self.filters.get("opportunity_type")})

		if self.filters.get("opportunity_source"):
			filters.append({"source": self.filters.get("opportunity_source")})

		if self.filters.get("status"):
			filters.append({"status": ("in", self.filters.get("status"))})

		if self.filters.get("from_date") and self.filters.get("to_date"):
			filters.append(
				["transaction_date", "between", [self.filters.get("from_date"), self.filters.get("to_date")]]
			)

		if self.filters.get("opportunity_owner"):
			filters.append({"opportunity_owner": self.filters.get("opportunity_owner")})

		return filters

	# ? Prepare line chart based on values across sales stages
	def get_chart_data(self):
		datasets = []
		values = [0] * len(self.sales_stage_list)

		options = {"Number": "count", "Amount": "amount"}[self.filters.get("data_based_on")]

		for data in self.query_result:
			for count in range(len(self.sales_stage_list)):
				if data["sales_stage"] == self.sales_stage_list[count]:
					values[count] += data[options]

		datasets.append({"name": options, "values": values})
		self.chart = {"data": {"labels": self.sales_stage_list, "datasets": datasets}, "type": "line"}

	# ? Utility to fetch exchange rate, with caching
	def get_exchange_rate(self, from_currency, to_currency):
		cacheobj = frappe.cache()
		if cacheobj and cacheobj.get(from_currency):
			return flt(str(cacheobj.get(from_currency), "UTF-8"))
		else:
			value = get_exchange_rate(from_currency, to_currency)
			cacheobj.set(from_currency, value)
			return flt(str(cacheobj.get(from_currency), "UTF-8"))

	# ? Get the default currency of the selected company
	def get_default_currency(self):
		company = self.filters.get("company")
		return frappe.db.get_value("Company", company, "default_currency")

	# ? Convert opportunity amounts to the base currency before aggregation
	def convert_to_base_currency(self):
		default_currency = self.get_default_currency()
		for data in self.query_result:
			if data.get("currency") and data.get("currency") != default_currency:
				opportunity_currency = data.get("currency")
				exchange_rate = self.get_exchange_rate(opportunity_currency, default_currency)
				data["amount"] = data["amount"] * exchange_rate
