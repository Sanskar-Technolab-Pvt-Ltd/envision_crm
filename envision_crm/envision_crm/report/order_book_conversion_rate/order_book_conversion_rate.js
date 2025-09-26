// Copyright (c) 2025, Envision and contributors
// For license information, please see license.txt

frappe.query_reports["Order Book Conversion Rate"] = {
	"filters": [
        {
            // Filter by Company (mandatory)
            "fieldname": "company",
            "label": __("Company"),
            "fieldtype": "Link",
            "options": "Company",
            "default": frappe.defaults.get_user_default("Company"),
            "reqd": 1
        },
        {
            // Filter by Department (optional)
            "fieldname": "custom_department",
            "label": __("Department"),
            "fieldtype": "Link",
            "options": "Department",
            "reqd": 0
        },
        {
            // From Date (defaults to 1 month ago)
            "fieldname": "from_date",
            "label": __("From Date"),
            "fieldtype": "Date",
            "default": frappe.datetime.add_months(frappe.datetime.get_today(), -1)
        },
        {
            // To Date (defaults to today)
            "fieldname": "to_date",
            "label": __("To Date"),
            "fieldtype": "Date",
            "default": frappe.datetime.get_today()
        },
        {
            // Status of the Opportunity
            "fieldname": "status",
            "label": __("Status"),
            "fieldtype": "Select",
            "options": "\nOpen\nQuotation\nConverted\nLost\nReplied",
            "default": ""
        },
        {
            // Opportunity Owner (User who created/owns the record)
            "fieldname": "opportunity_owner",
            "label": __("Opportunity Owner"),
            "fieldtype": "Link",
            "options": "User",
            "reqd": 0
        }
    ]
};
