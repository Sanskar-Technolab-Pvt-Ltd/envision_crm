// Copyright (c) 2025, Envision and contributors
// For license information, please see license.txt

frappe.query_reports["Opportunity Summary by Sales Stages"] = {
	filters: [
		// ? Choose the main grouping basis for the report (e.g., by Owner, Source, or Opportunity Type)
		{
			fieldname: "based_on",
			label: __("Based On"),
			fieldtype: "Select",
			options: "Opportunity Owner\nSource\nOpportunity Type",
			default: "Opportunity Owner",
		},

		// ? Choose whether to show count of opportunities or total amount (value)
		{
			fieldname: "data_based_on",
			label: __("Data Based On"),
			fieldtype: "Select",
			options: "Number\nAmount",
			default: "Number",
		},

		// ? Set the start date to filter opportunities from
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
		},

		// ? Set the end date to filter opportunities until
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
		},

		// ? Filter opportunities by multiple statuses (e.g., Open, Converted)
		{
			fieldname: "status",
			label: __("Status"),
			fieldtype: "MultiSelectList",
			options: ["Open", "Converted", "Quotation", "Replied"],
			get_data: function () {
				return [
					{ value: "Open", description: "Status" },
					{ value: "Converted", description: "Status" },
					{ value: "Quotation", description: "Status" },
					{ value: "Replied", description: "Status" },
				];
			},
		},

		// ? Filter by the source of the opportunity (e.g., Website, Referral)
		{
			fieldname: "opportunity_source",
			label: __("Opportunity Source"),
			fieldtype: "Link",
			options: "Lead Source",
		},

		// ? Filter by the type of opportunity (e.g., Sales, Partnership)
		{
			fieldname: "opportunity_type",
			label: __("Opportunity Type"),
			fieldtype: "Link",
			options: "Opportunity Type",
		},

		// ? Filter data based on a specific company (default set to user's company)
		{
			fieldname: "company",
			label: __("Company"),
			fieldtype: "Link",
			options: "Company",
			default: frappe.defaults.get_user_default("Company"),
		},

		// ? Directly filter by a specific Opportunity Owner (User)
		{
			fieldname: "opportunity_owner",
			label: __("Opportunity Owner"),
			fieldtype: "Link",
			options: "User",
		},
	],
};
