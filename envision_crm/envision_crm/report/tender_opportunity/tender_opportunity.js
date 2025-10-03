// Copyright (c) 2025, Prompt Group and contributors
// For license information, please see license.txt

frappe.query_reports["Tender Opportunity Report"] = {
	"filters": [
		{
			// ? DATE RANGE SELECTOR WITH PREDEFINED OPTIONS
			fieldname: "date_range",
			label: __("Date Range"),
			fieldtype: "Select",
			options: [
			  { value: "", label: __("") },
			  { value: "today_only", label: __("Today") },
			  { value: "yesterday", label: __("Yesterday") },
			  { value: "this_week", label: __("This Week") },
			  { value: "last_week", label: __("Last week") },
			  { value: "last_15_days", label: __("Last 15 Days") },
			  { value: "this_month", label: __("This Month") },
			  { value: "last_month", label: __("Last Month") },
			  { value: "this_year", label: __("This Year") },
			  { value: "custom_date_range", label: __("Date Range") },
			],
			default: "",
		  },
		{
			// ? FROM DATE - ONLY SHOWN WHEN CUSTOM RANGE IS SELECTED
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			depends_on: "eval:doc.date_range === 'custom_date_range'"
		},
		{
			// ? TO DATE - ONLY SHOWN WHEN CUSTOM RANGE IS SELECTED
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			depends_on: "eval:doc.date_range === 'custom_date_range'"
		},
		{
			// ? CUSTOMER FILTER - LINKS TO CUSTOMER DOCTYPE
			fieldname: "customer",
			label: __("Customer"),
			fieldtype: "Link",
			options: "Customer"
		},
		{
			// ? TENDER OPPORTUNITY STATUS FILTER
			fieldname: "status",
			label: __("Tender Opportunity Status"),
			fieldtype: "Select",
			options: [
				"",
				"Tender Invitation Received",
				"Pre Bid Meeting Completed",
				"Tender Not Quoted",
				"Tender Filling In-progress",
				"Tender Submitted",
				"Demo",
				"Technical Bid Opened",
				"Technically Qualified",
				"Technically Disqualified",
				"Price Bid Opened",
				"Negotiation / Review",
				"We are L1",
				"Closed Won - Tender",
				"Closed Lost to Competition",
				"Delayed / On Hold",
				"Gone for Re-Tendering",
				"Tender Cancelled"
			]
		},
		{
			// ? OPPORTUNITY OWNER FILTER - LINKS TO USER DOCTYPE
			fieldname: "opportunity_owner",
			label: __("Opportunity Owner"),
			fieldtype: "Link",
			options: "User"
		},
		{
			// ? PRODUCT FILTER
			fieldname: "product",
			label: __("Product"),
			fieldtype: "Link",
			options: "Item"
		}
	],
	// ? ONLOAD FUNCTION TO INITIALIZE FILTER LOGIC
	// "onload": function (report) {
    //     initializeFilters();
    // }
};

// ? FUNCTION TO SET DEFAULT FILTER VALUES AND HANDLE EVENTS
// function initializeFilters() {
//     frappe.query_reports.set_filter_value("date_range", "");
//     $("select[data-fieldname=date_range]").off("change").on("change", function () {
//         const dateRange = frappe.query_reports.get_filter_value("date_range");

//         if (dateRange) {
//             frappe.query_reports.set_filter_value("date_range", dateRange);
//         }
//     });
// }

// // ? INITIALIZE FILTERS ON PAGE LOAD
// initializeFilters();
